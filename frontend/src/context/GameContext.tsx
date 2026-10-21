import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { quests as initialQuests } from "../data/quests";
import { progressData } from "../data/progress";
import { findCampus, type CampusId } from "../data/campuses";
import { practiceStorageKey } from "../components/Tutorial/tutorialSteps";
import { getBattleRankReward, RANK_PROGRESS_VERSION, type BattleOutcome } from "../utils/hunterRank";
import { getRewardExp } from "../utils/questReward";
import { useStorageSync } from "./useStorageSync";
import { GAME_STORAGE_KEY, loadSavedGame, saveGame } from "../utils/gameStorage";
import { mapAreas } from "../data/maps";
import { restoreFieldNoveltyIds } from "../utils/fieldProgress";
import { getWeaponAttackBonus } from "../utils/playerStats";
import { hasEnoughWeaponMaterials } from "../utils/weaponMaterials";

type MaterialStock = Record<number, number>;

export type Activity = {
  id: string;
  type: "hunt" | "investigation" | "exchange" | "craft";
  title: string;
  detail: string;
  createdAt: string;
};

type GameState = {
  campusId: CampusId | null;
  quests: typeof initialQuests;
  materials: MaterialStock;
  rank: number;
  rankExp: number;
  rankProgressVersion: number;
  weaponClaimed: boolean;
  obtainedFieldNoveltyIds: number[];
  activities: Activity[];
};

type GameContextType = GameState & {
  selectCampus: (campusId: CampusId) => void;
  requiresUpdate: boolean;
  canUpdateGame: () => boolean;
  resolveBattle: (
    questId: string,
    outcome: BattleOutcome,
    isGoldCrown?: boolean
  ) => void;
  claimWeapon: () => boolean;
  // ステッカーの交換が成功したことを記録する（在庫の減算は API で行う）
  // 記録できなかったら false（新しいバージョンのデータがある場合など）
  claimFieldNovelty: (fieldId: number) => boolean;
};

const initialMaterials: MaterialStock = Object.fromEntries(
  progressData.materials.map((material) => [
    material.id,
    material.owned,
  ])
);

const initialGameState: GameState = {
  campusId: null,
  quests: initialQuests,
  materials: initialMaterials,
  rank: 0,
  rankExp: 0,
  rankProgressVersion: RANK_PROGRESS_VERSION,
  weaponClaimed: false,
  obtainedFieldNoveltyIds: [],
  activities: [],
};

// クエストの定義（素材・手数・ステータス・EXP）は常に data/quests.ts を使い、
// 保存データからは進行度（討伐済み・金冠・調査済み）だけを引き継ぐ。定義を変えてもキャッシュ削除が不要になる
// investigated を記録する前に調査したクエストは、履歴の「調査」から補う
function mergeQuestProgress(
  savedQuests: GameState["quests"],
  activities: Activity[] = [],
): GameState["quests"] {
  const investigatedIds = new Set(
    (Array.isArray(activities) ? activities : [])
      .filter((activity) => activity?.type === "investigation")
      .map((activity) => initialQuests.find((quest) => String(activity.id).includes(`-${quest.id}-`))?.id)
      .filter(Boolean),
  );

  return initialQuests.map((quest) => {
    const saved = Array.isArray(savedQuests)
      ? savedQuests.find((item) => item?.id === quest.id)
      : undefined;

    return {
      ...quest,
      completed: saved?.completed === true,
      goldCrown: saved?.goldCrown === true,
      investigated: saved?.investigated === true || investigatedIds.has(quest.id),
    };
  });
}
function loadGameState(practiceCampus?: CampusId): GameState {
  const defaults = practiceCampus ? {
    ...initialGameState, campusId: practiceCampus,
    materials: Object.fromEntries(progressData.materials.map((material) => [material.id, Math.max(0, material.required - (initialQuests[0].rewardMaterials.find((reward) => reward.id === material.id)?.amount ?? 0))])),
  } : initialGameState;
  if (typeof window === "undefined") {
    return defaults;
  }

  try {
    const reader = practiceCampus ? { getItem: () => window.sessionStorage.getItem(practiceStorageKey) } : window.localStorage;
    const saved = loadSavedGame(reader, defaults);
    return {
      ...saved,
      campusId: practiceCampus ?? findCampus(saved.campusId)?.id ?? null,
      quests: mergeQuestProgress(saved.quests, saved.activities),
      obtainedFieldNoveltyIds: restoreFieldNoveltyIds(saved.obtainedFieldNoveltyIds, mapAreas),
    };
  } catch {
    return defaults;
  }
}
function saveGameState(gameState: GameState, practiceCampus?: CampusId): boolean {
  try {
    if (practiceCampus) {
      window.sessionStorage.setItem(practiceStorageKey, JSON.stringify(gameState));
      return true;
    }
    const storage = window.localStorage;
    if (
      gameState.rankProgressVersion > RANK_PROGRESS_VERSION
      || loadSavedGame(storage, initialGameState).rankProgressVersion > RANK_PROGRESS_VERSION
    ) return false;
    // 同じ内容を別タブへ書き戻し続けないようにする。
    return storage.getItem(GAME_STORAGE_KEY) === JSON.stringify(gameState)
      || saveGame(storage, gameState);
  } catch {
    // ブラウザによっては localStorage 自体へのアクセスが拒否される。
    return false;
  }
}

const GameContext = createContext<GameContextType | null>(null);
export function GameProvider({ children, practiceCampus }: { children: ReactNode; practiceCampus?: CampusId }) {
  const [gameState, setGameState] = useState<GameState>(() => loadGameState(practiceCampus));

  const [saveFailed, setSaveFailed] = useState(false);
  const pendingSave = useRef<GameState | null>(null);
  const requiresUpdate = gameState.rankProgressVersion > RANK_PROGRESS_VERSION;

  // 操作直前にも確認し、storage イベントが届く前の受取・交換を防ぐ。
  const canUpdateGame = useCallback(() => {
    if (practiceCampus) return true;
    if (requiresUpdate) return false;
    const latest = loadGameState();
    if (latest.rankProgressVersion > RANK_PROGRESS_VERSION) {
      pendingSave.current = null;
      setSaveFailed(false);
      setGameState(latest);
      return false;
    }
    return true;
  }, [requiresUpdate, practiceCampus]);

  useEffect(() => {
    // 現在の状態を保存する前に、保存先のデータが新しい形式か確認する。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!canUpdateGame()) return;
    const saved = saveGameState(gameState, practiceCampus);
    pendingSave.current = saved ? null : gameState;
    // 保存の成否を画面に反映する。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaveFailed(!saved);
  }, [gameState, canUpdateGame, practiceCampus]);

  // 別タブで保存された進行度を反映し、古い状態で上書きしないようにする
  useStorageSync(GAME_STORAGE_KEY, () => {
    // 将来版を検出したら、未保存の旧形式データも書き戻さない。
    if (!canUpdateGame()) return;
    // 未保存の進行は保持し、同期で読み直す前に保存を再試行する。
    if (pendingSave.current) {
      const saved = saveGameState(pendingSave.current, practiceCampus);
      if (saved) pendingSave.current = null;
      setSaveFailed(!saved);
      return;
    }

    const next = loadGameState();

    // 中身が変わっていなければ何もしない（表示に戻るたびの再描画を防ぐ）
    setGameState((current) =>
      JSON.stringify(current) === JSON.stringify(next) ? current : next
    );
  }, !practiceCampus);

  const value = useMemo<GameContextType>(() => {
    const resolveBattle = (
      questId: string,
      outcome: BattleOutcome,
      isGoldCrown = false
    ) => {
      if (!canUpdateGame()) return;
      setGameState((current) => {
        if (current.rankProgressVersion > RANK_PROGRESS_VERSION) return current;
        const quest = current.quests.find((item) => item.id === questId);

        // 討伐済みでも周回で再討伐した分の報酬は受け取れる
        if (!quest) {
          return current;
        }

        const rewardRate = outcome === "victory" ? 1 : 0.5;
        const rewards = quest.rewardMaterials.map((reward) => ({
          ...reward,
          amount: Math.max(1, Math.ceil(reward.amount * rewardRate)),
        }));
        // EXP はクエストごとの報酬（調査は3割）。ランクの上限処理は getBattleRankReward に任せる
        const { gainedExp, rank: nextRank, rankExp: nextExp } =
          getBattleRankReward(current.rankExp, getRewardExp(quest.id, outcome));
        const expDetail = gainedExp > 0 ? `経験値 +${gainedExp}` : "ハンターランク上限";
        const materials = { ...current.materials };

        rewards.forEach((reward) => {
          materials[reward.id] = (materials[reward.id] ?? 0) + reward.amount;
        });

        const activity: Activity = {
          id: `${Date.now()}-${questId}-${outcome}`,
          type: outcome === "victory" ? "hunt" : "investigation",
          title:
            outcome === "victory"
              ? `${quest.title}を討伐`
              : `${quest.title}を調査`,
          detail:
            outcome === "victory"
              ? `${expDetail}${isGoldCrown ? "・金冠を獲得" : ""}`
              : `落とし物を発見・${expDetail}`,
          createdAt: new Date().toISOString(),
        };

        return {
          ...current,
          quests: current.quests.map((item) => {
            if (item.id !== questId) return item;

            return outcome === "victory"
              ? { ...item, completed: true, goldCrown: item.goldCrown || isGoldCrown }
              : { ...item, investigated: true };
          }),
          materials,
          rank: nextRank,
          rankExp: nextExp,
          activities: [activity, ...current.activities],
        };
      });
    };

    const claimWeapon = () => {
      if (!canUpdateGame()) return false;
      const canClaim =
        !gameState.weaponClaimed &&
        hasEnoughWeaponMaterials(gameState.materials);

      if (!canClaim) {
        return false;
      }

      setGameState((current) => {
        if (current.weaponClaimed || current.rankProgressVersion > RANK_PROGRESS_VERSION) {
          return current;
        }

        const materials = { ...current.materials };

        progressData.materials.forEach((material) => {
          materials[material.id] -= material.required;
        });

        return {
          ...current,
          materials,
          weaponClaimed: true,
          activities: [
            {
              id: `${Date.now()}-weapon-exchange`,
              type: "craft",
              title: `${progressData.weaponName}を作成`,
              detail: `攻撃力 +${getWeaponAttackBonus()}`,
              createdAt: new Date().toISOString(),
            },
            ...current.activities,
          ],
        };
      });

      return true;
    };
    const claimFieldNovelty = (fieldId: number) => {
      const area = mapAreas.find((item) => item.id === fieldId);

      if (!area || !canUpdateGame()) return false;
      setGameState((current) => {
        if (current.obtainedFieldNoveltyIds.includes(fieldId)) return current;

        return {
          ...current,
          // mapAreas の順に並べて保存する
          obtainedFieldNoveltyIds: restoreFieldNoveltyIds(
            [...current.obtainedFieldNoveltyIds, fieldId],
            mapAreas,
          ),
          activities: [
            {
              id: `${Date.now()}-novelty-${fieldId}`,
              type: "exchange",
              title: `${area.novelty.name}を交換`,
              detail: `交換場所：${area.novelty.redemptionLocation}`,
              createdAt: new Date().toISOString(),
            },
            ...current.activities,
          ],
        };
      });

      return true;
    };
    const selectCampus = (campusId: CampusId) => {
      if (canUpdateGame()) setGameState((current) => ({ ...current, campusId }));
    };
    return { ...gameState, selectCampus, requiresUpdate, canUpdateGame, resolveBattle, claimWeapon, claimFieldNovelty };
  }, [gameState, requiresUpdate, canUpdateGame]);

  return (
    <GameContext.Provider value={value}>
      {children}
      {requiresUpdate && (
        <div className="game-save-notice" role="alert">
          新しいバージョンの進行状況があります。続けるには再読み込みしてください。
          <button type="button" onClick={() => window.location.reload()}>再読み込み</button>
        </div>
      )}
      {saveFailed && !requiresUpdate && (
        <p className="game-save-notice" role="status">
          進行状況を保存できません。再読み込みすると進行状況が失われる場合があります。
        </p>
      )}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error("useGame must be used inside GameProvider");
  }

  return context;
}

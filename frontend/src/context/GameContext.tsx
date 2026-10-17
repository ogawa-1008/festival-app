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
import { getBattleRankReward, RANK_PROGRESS_VERSION, type BattleOutcome } from "../utils/hunterRank";
import { getRewardExp } from "../utils/questReward";
import { useStorageSync } from "./useStorageSync";
import { GAME_STORAGE_KEY, loadSavedGame, saveGame } from "../utils/gameStorage";

type MaterialStock = Record<number, number>;

export type Activity = {
  id: string;
  type: "hunt" | "investigation" | "exchange";
  title: string;
  detail: string;
  createdAt: string;
};

type GameState = {
  quests: typeof initialQuests;
  materials: MaterialStock;
  rank: number;
  rankExp: number;
  rankProgressVersion: number;
  weaponClaimed: boolean;
  activities: Activity[];
};

type GameContextType = GameState & {
  requiresUpdate: boolean;
  canUpdateGame: () => boolean;
  resolveBattle: (
    questId: string,
    outcome: BattleOutcome,
    isGoldCrown?: boolean
  ) => void;
  claimWeapon: () => boolean;
};

const initialMaterials: MaterialStock = Object.fromEntries(
  progressData.materials.map((material) => [
    material.id,
    material.owned,
  ])
);

const initialGameState: GameState = {
  quests: initialQuests,
  materials: initialMaterials,
  rank: 0,
  rankExp: 0,
  rankProgressVersion: RANK_PROGRESS_VERSION,
  weaponClaimed: false,
  activities: [],
};

function loadGameState(): GameState {
  if (typeof window === "undefined") {
    return initialGameState;
  }

  try {
    return loadSavedGame(window.localStorage, initialGameState);
  } catch {
    return initialGameState;
  }
}

function saveGameState(gameState: GameState): boolean {
  try {
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

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(loadGameState);

  const [saveFailed, setSaveFailed] = useState(false);
  const pendingSave = useRef<GameState | null>(null);
  const requiresUpdate = gameState.rankProgressVersion > RANK_PROGRESS_VERSION;

  // 操作直前にも確認し、storage イベントが届く前の受取・交換を防ぐ。
  const canUpdateGame = useCallback(() => {
    if (requiresUpdate) return false;
    const latest = loadGameState();
    if (latest.rankProgressVersion > RANK_PROGRESS_VERSION) {
      pendingSave.current = null;
      setSaveFailed(false);
      setGameState(latest);
      return false;
    }
    return true;
  }, [requiresUpdate]);

  useEffect(() => {
    // 現在の状態を保存する前に、保存先のデータが新しい形式か確認する。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!canUpdateGame()) return;
    const saved = saveGameState(gameState);
    pendingSave.current = saved ? null : gameState;
    // 保存の成否を画面に反映する。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaveFailed(!saved);
  }, [gameState, canUpdateGame]);

  // 別タブで保存された進行度を反映し、古い状態で上書きしないようにする
  useStorageSync(GAME_STORAGE_KEY, () => {
    // 将来版を検出したら、未保存の旧形式データも書き戻さない。
    if (!canUpdateGame()) return;
    // 未保存の進行は保持し、同期で読み直す前に保存を再試行する。
    if (pendingSave.current) {
      const saved = saveGameState(pendingSave.current);
      if (saved) pendingSave.current = null;
      setSaveFailed(!saved);
      return;
    }

    const next = loadGameState();

    // 中身が変わっていなければ何もしない（表示に戻るたびの再描画を防ぐ）
    setGameState((current) =>
      JSON.stringify(current) === JSON.stringify(next) ? current : next
    );
  });

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
        const expDetail = gainedExp > 0 ? `HR EXP +${gainedExp}` : "HR MAX";
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
          quests: current.quests.map((item) =>
            item.id === questId && outcome === "victory"
              ? { ...item, completed: true, goldCrown: item.goldCrown || isGoldCrown }
              : item
          ),
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
        progressData.materials.every(
          (material) =>
            (gameState.materials[material.id] ?? 0) >= material.required
        );

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
              type: "exchange",
              title: `${progressData.weaponName}のピンバッジを交換`,
              detail: "特典を受け取れます。運営スタッフにこの画面を提示してください。",
              createdAt: new Date().toISOString(),
            },
            ...current.activities,
          ],
        };
      });

      return true;
    };

    return { ...gameState, requiresUpdate, canUpdateGame, resolveBattle, claimWeapon };
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

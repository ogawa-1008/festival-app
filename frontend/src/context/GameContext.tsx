import {
  createContext,
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
    // 同じ内容を別タブへ書き戻し続けないようにする。
    return storage.getItem(GAME_STORAGE_KEY) === JSON.stringify(gameState)
      || saveGame(storage, gameState);
  } catch {
    // Accessing localStorage itself may be blocked by the browser.
    return false;
  }
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(loadGameState);

  const [saveFailed, setSaveFailed] = useState(false);
  const pendingSave = useRef<GameState | null>(null);

  useEffect(() => {
    const saved = saveGameState(gameState);
    pendingSave.current = saved ? null : gameState;
    // Report the result of synchronizing React state with external storage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaveFailed(!saved);
  }, [gameState]);

  // 別タブで保存された進行度を反映し、古い状態で上書きしないようにする
  useStorageSync(GAME_STORAGE_KEY, () => {
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
      setGameState((current) => {
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
        if (current.weaponClaimed) {
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

    return { ...gameState, resolveBattle, claimWeapon };
  }, [gameState]);

  return (
    <GameContext.Provider value={value}>
      {children}
      {saveFailed && (
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

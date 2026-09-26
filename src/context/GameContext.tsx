import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { quests as initialQuests } from "../data/quests";
import { progressData } from "../data/progress";

type MaterialStock = Record<number, number>;

export type Activity = {
  id: string;
  type: "hunt" | "investigation" | "exchange";
  title: string;
  detail: string;
  createdAt: string;
};

type BattleOutcome = "victory" | "failure";

type GameState = {
  quests: typeof initialQuests;
  materials: MaterialStock;
  rank: number;
  rankExp: number;
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

const storageKey = "monster-hunter-festival-game";

const initialMaterials: MaterialStock = Object.fromEntries(
  progressData.materials.map((material) => [
    material.id,
    material.owned,
  ])
);

const initialGameState: GameState = {
  quests: initialQuests,
  materials: initialMaterials,
  rank: 1,
  rankExp: 0,
  weaponClaimed: false,
  activities: [],
};

function loadGameState(): GameState {
  if (typeof window === "undefined") {
    return initialGameState;
  }

  try {
    const saved = window.localStorage.getItem(storageKey);

    if (!saved) {
      return initialGameState;
    }

    const parsed = JSON.parse(saved) as Partial<GameState>;

    return {
      ...initialGameState,
      ...parsed,
      quests: parsed.quests ?? initialGameState.quests,
      materials: parsed.materials ?? initialGameState.materials,
      activities: parsed.activities ?? initialGameState.activities,
    };
  } catch {
    return initialGameState;
  }
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(loadGameState);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(gameState));
  }, [gameState]);

  const value = useMemo<GameContextType>(() => {
    const resolveBattle = (
      questId: string,
      outcome: BattleOutcome,
      isGoldCrown = false
    ) => {
      setGameState((current) => {
        const quest = current.quests.find((item) => item.id === questId);

        if (!quest || (outcome === "victory" && quest.completed)) {
          return current;
        }

        const rewardRate = outcome === "victory" ? 1 : 0.5;
        const rewards = quest.rewardMaterials.map((reward) => ({
          ...reward,
          amount: Math.max(1, Math.ceil(reward.amount * rewardRate)),
        }));
        const gainedExp = outcome === "victory" ? 100 : 30;
        const nextExp = current.rankExp + gainedExp;
        const nextRank = 1 + Math.floor(nextExp / 100);
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
              ? `HR EXP +${gainedExp}${isGoldCrown ? "・金冠を獲得" : ""}`
              : `落とし物を発見・HR EXP +${gainedExp}`,
          createdAt: new Date().toISOString(),
        };

        return {
          ...current,
          quests: current.quests.map((item) =>
            item.id === questId && outcome === "victory"
              ? { ...item, completed: true, goldCrown: isGoldCrown }
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

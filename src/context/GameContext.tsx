import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import { quests as initialQuests } from "../data/quests";

type MaterialStock = {
  [materialId: number]: number;
};

type GameContextType = {
  quests: typeof initialQuests;
  materials: MaterialStock;

  completeQuest: (questId: string) => void;
};

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [quests, setQuests] = useState(initialQuests);

  const [materials, setMaterials] =
    useState<MaterialStock>({
      1: 0,
      2: 0,
      3: 0,
      4: 0,
    });

  const completeQuest = (questId: string) => {
    const quest = quests.find(
      (item) => item.id === questId
    );

    if (!quest || quest.completed) {
      return;
    }

    setQuests((currentQuests) =>
      currentQuests.map((item) =>
        item.id === questId
          ? {
              ...item,
              completed: true,
            }
          : item
      )
    );

    setMaterials((currentMaterials) => {
      const updated = {
        ...currentMaterials,
      };

      quest.rewardMaterials.forEach((reward) => {
        updated[reward.id] =
          (updated[reward.id] || 0) + reward.amount;
      });

      return updated;
    });
  };

  return (
    <GameContext.Provider
      value={{
        quests,
        materials,
        completeQuest,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error(
      "useGame must be used inside GameProvider"
    );
  }

  return context;
}
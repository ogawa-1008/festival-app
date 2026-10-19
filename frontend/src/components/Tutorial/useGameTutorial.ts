import { createContext, useContext } from "react";

export const GameTutorialContext = createContext<{
  startTutorial: () => void;
  active: boolean;
  step: string | null;
  questId: string;
  advance: (action: string) => void;
} | null>(null);

export function useGameTutorial() {
  const tutorial = useContext(GameTutorialContext);
  if (!tutorial) throw new Error("GameTutorial is required");
  return tutorial;
}

import { createContext, useContext } from "react";

export const GameTutorialContext = createContext<{
  startTutorial: () => void;
  active: boolean;
  // ガイドを×で最小化しているか（最小化中は、ほかのボタンも押せる）
  minimized: boolean;
  step: string | null;
  questId: string;
  advance: (action: string) => void;
} | null>(null);

export function useGameTutorial() {
  const tutorial = useContext(GameTutorialContext);
  if (!tutorial) throw new Error("GameTutorial is required");
  return tutorial;
}

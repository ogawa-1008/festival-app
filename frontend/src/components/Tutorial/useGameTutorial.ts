import { createContext, useContext } from "react";

export const GameTutorialContext = createContext<(() => void) | null>(null);

export function useGameTutorial() {
  const startTutorial = useContext(GameTutorialContext);
  if (!startTutorial) throw new Error("GameTutorial is required");
  return startTutorial;
}

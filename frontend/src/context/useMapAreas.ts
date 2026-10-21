import { useMemo } from "react";

import { useGameTutorial } from "../components/Tutorial/useGameTutorial";
import { getMapAreas } from "../data/maps";
import { PRACTICE_QUEST_ID } from "../data/quests";
import { useGame } from "./GameContext";

// 選んでいる校舎のフィールド。練習中は、最初のフィールドに練習用のクエストを出す
export function useMapAreas() {
  const { campusId } = useGame();
  const { active: practice } = useGameTutorial();

  return useMemo(() => {
    const areas = getMapAreas(campusId);
    if (!practice) return areas;

    return areas.map((area, index) =>
      index === 0 ? { ...area, questIds: [PRACTICE_QUEST_ID, ...area.questIds] } : area,
    );
  }, [campusId, practice]);
}

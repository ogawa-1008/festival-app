import { useMemo, type CSSProperties } from "react";
import { useGame } from "../../../context/GameContext";
import { useGameTutorial } from "../../Tutorial/useGameTutorial";
import { PRACTICE_QUEST_ID } from "../../../data/quests";
import { useMapAreas } from "../../../context/useMapAreas";
import QuestCard from "./QuestCard";
import "./QuestList.css";

function QuestList() {
  const { quests } = useGame();
  const { active: practice } = useGameTutorial();
  // 選んでいるエリアの全建物のクエストを表示する（練習中は練習用のクエストだけ）
  const visibleQuests = practice
    ? quests.filter((quest) => quest.id === PRACTICE_QUEST_ID)
    : quests;
  // クエストの建物名は、カードごとに探さず一度だけ表にする
  const mapAreas = useMapAreas();
  const buildingNames = useMemo(
    () => new Map(mapAreas.flatMap((area) => area.questIds.map((id) => [id, area.buildingName] as const))),
    [mapAreas],
  );

  return (
    // 掲示板は1枚にし、カードの数に合わせて縦に伸ばす（高さは QuestList.css で計算する）
    <div className="quest-board" style={{ "--quest-count": Math.max(1, visibleQuests.length) } as CSSProperties}>
      <div className="quest-board-header"><span>QUEST BOARD</span></div>
      <div className="quest-board-list">
        {visibleQuests.length === 0 ? (
          <p className="quest-board-empty">このエリアのモンスターは準備中です。</p>
        ) : visibleQuests.map((quest, index) => (
          <QuestCard key={quest.id} quest={quest} index={index} buildingName={buildingNames.get(quest.id)} />
        ))}
      </div>
    </div>
  );
}

export default QuestList;

import { useGame } from "../../../context/GameContext";
import { useMapAreas } from "../../../context/useMapAreas";
import { useGameTutorial } from "../../Tutorial/useGameTutorial";
import { PRACTICE_QUEST_ID } from "../../../data/quests";
import QuestCard from "./QuestCard";
import "./QuestList.css";

// 既存の掲示板1枚につき3クエスト。4校舎以上の会場もすべて表示する。
const positions = ["top", "middle", "bottom"] as const;

function QuestList() {
  const { quests, buildingId } = useGame();
  const { active: practice } = useGameTutorial();
  const mapAreas = useMapAreas();
  // 選んでいる校舎（号館）のクエストだけを表示する。
  // 校舎を選ぶ前・保存データが古いときは、今までどおり会場の全クエストを表示する
  const building = mapAreas.find((area) => area.id === buildingId);
  const campusQuests = building
    ? quests.filter((quest) => building.questIds.includes(quest.id))
    : quests;
  const visibleQuests = practice
    ? quests.filter((quest) => quest.id === PRACTICE_QUEST_ID)
    : campusQuests;
  const boards = Array.from({ length: Math.max(1, Math.ceil(visibleQuests.length / 3)) }, (_, index) =>
    visibleQuests.slice(index * 3, index * 3 + 3),
  );

  return boards.map((board, boardIndex) => (
    <div className="quest-board" key={boardIndex} style={{ height: 60 + Math.max(1, board.length) * 325 }}>
      <div className="quest-board-header"><span>QUEST BOARD</span></div>
      <div className="quest-board-list">
        {board.length === 0 ? (
          <p className="quest-board-empty">この校舎のモンスターは準備中です。</p>
        ) : board.map((quest, index) => (
          <QuestCard key={quest.id} quest={quest} position={positions[index]} />
        ))}
      </div>
    </div>
  ));
}

export default QuestList;

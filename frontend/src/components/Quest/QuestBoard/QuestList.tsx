import { useGame } from "../../../context/GameContext";
import { useGameTutorial } from "../../Tutorial/useGameTutorial";
import { PRACTICE_QUEST_ID } from "../../../data/quests";
import QuestCard, { QUEST_CARD_PITCH } from "./QuestCard";
import "./QuestList.css";

function QuestList() {
  const { quests } = useGame();
  const { active: practice } = useGameTutorial();
  // 選んでいるエリアの全建物のクエストを表示する（練習中は練習用のクエストだけ）
  const visibleQuests = practice
    ? quests.filter((quest) => quest.id === PRACTICE_QUEST_ID)
    : quests;
  // 掲示板は1枚にし、カードの数に合わせて縦に伸ばす（上部の見出しの分＋カードの枚数分）
  const height = 60 + Math.max(1, visibleQuests.length) * QUEST_CARD_PITCH;

  return (
    <div className="quest-board" style={{ height }}>
      <div className="quest-board-header"><span>QUEST BOARD</span></div>
      <div className="quest-board-list">
        {visibleQuests.length === 0 ? (
          <p className="quest-board-empty">このエリアのモンスターは準備中です。</p>
        ) : visibleQuests.map((quest, index) => (
          <QuestCard key={quest.id} quest={quest} index={index} />
        ))}
      </div>
    </div>
  );
}

export default QuestList;

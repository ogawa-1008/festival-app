import { useGame } from "../../../context/GameContext";

import QuestCard from "./QuestCard";

import "./QuestList.css";

function QuestList() {
  const { quests } = useGame();

  return (
    <div className="quest-board">

      <div className="quest-board-header">
        <span>QUEST BOARD</span>
      </div>

      <div className="quest-board-list">

        <QuestCard
          quest={quests[0]}
          position="top"
        />

        <QuestCard
          quest={quests[1]}
          position="middle"
        />

        <QuestCard
          quest={quests[2]}
          position="bottom"
        />

      </div>

    </div>
  );
}

export default QuestList;
import { useGame } from "../../../context/GameContext";

import QuestCard from "./QuestCard";

import "./QuestList.css";

// 掲示板に貼れるクエストは3枚まで（上・中・下）
const positions = ["top", "middle", "bottom"] as const;

function QuestList() {
  const { quests } = useGame();

  return (
    <div className="quest-board">

      <div className="quest-board-header">
        <span>QUEST BOARD</span>
      </div>

      <div className="quest-board-list">

        {quests.length === 0 ? (
          <p className="quest-board-empty">
            この校舎のモンスターは準備中です。
          </p>
        ) : (
          positions.map((position, index) =>
            quests[index] ? (
              <QuestCard
                key={quests[index].id}
                quest={quests[index]}
                position={position}
              />
            ) : null,
          )
        )}

      </div>

    </div>
  );
}

export default QuestList;

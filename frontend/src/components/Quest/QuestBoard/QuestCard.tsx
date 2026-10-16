import { useNavigate } from "react-router-dom";

import type { Quest } from "../../../types/quest";

import "./QuestCard.css";

type QuestCardProps = {
  quest: Quest;
  position: "top" | "middle" | "bottom";
};

function QuestCard({
  quest,
  position,
}: QuestCardProps) {
  const navigate = useNavigate();

  const handleQuestClick = () => {
    if (quest.completed) {
      return;
    }

    navigate("/qr-scanner");
  };

  return (
    <button
      className={`quest-card quest-${position}`}
      type="button"
      onClick={handleQuestClick}
    >
      <div className="quest-paper">

        {/* ==========================
            ヘッダー
        ========================== */}

        <div className="quest-paper-header">
          <span className="quest-type">
            討伐クエスト
          </span>

          <span className="quest-symbol">
            ◆
          </span>
        </div>


        {/* ==========================
            クエストタイトル
        ========================== */}

        <h2 className="quest-title">
          {quest.title}
        </h2>

        <div className="quest-target">
          TARGET MONSTER
        </div>


        {/* ==========================
            モンスター
        ========================== */}

        <div className="quest-monster-area">
          <div className="quest-monster-frame">

            <img
              src={quest.image}
              alt={quest.title}
              className="quest-monster-image"
            />

          </div>
        </div>


        {/* ==========================
            クエスト情報
        ========================== */}

        <div className="quest-info">

          <div className="quest-info-row">

            <div>
              <span className="quest-info-label">
                AREA
              </span>

              <strong>
                文化祭フィールド
              </strong>
            </div>

            <div>
              <span className="quest-info-label">
                TYPE
              </span>

              <strong>
                討伐
              </strong>
            </div>

          </div>

          <div className="quest-info-row">

            <div>
              <span className="quest-info-label">
                QUEST
              </span>

              <strong>
                QR SCAN
              </strong>
            </div>

            <div>
              <span className="quest-info-label">
                REWARD
              </span>

              <strong>
                MATERIAL
              </strong>
            </div>

          </div>

        </div>


        {/* ==========================
            フッター
        ========================== */}

        <div className="quest-footer">

          <span>
            VANTAN × MONSTER HUNTER
          </span>

          <span>
            QRコードを読み取って挑戦
          </span>

        </div>


        {/* ==========================
            クリアスタンプ
        ========================== */}

        {quest.completed && (
          <img
            src="/images/quests/stamp-image.png"
            alt="CLEAR"
            className="quest-clear-stamp"
          />
        )}

      </div>
    </button>
  );
}

export default QuestCard;
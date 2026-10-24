import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";

import type { Quest } from "../../../types/quest";
import { useGameTutorial } from "../../Tutorial/useGameTutorial";
import { useMapAreas } from "../../../context/useMapAreas";

import "./QuestCard.css";

type QuestCardProps = {
  quest: Quest;
  // 掲示板の上から何枚目か（0から）。位置と重なり順をこの番号から決める
  index: number;
};

// カード1枚分の縦の間隔（カードの高さ315px＋すき間10px）と、1枚目の位置
export const QUEST_CARD_PITCH = 325;
const QUEST_CARD_FIRST_TOP = 45;

function QuestCard({
  quest,
  index,
}: QuestCardProps) {
  const navigate = useNavigate();
  const { active, advance } = useGameTutorial();
  const area = useMapAreas().find((item) => item.questIds.includes(quest.id));

  const handleQuestClick = () => {
    if (quest.completed) {
      return;
    }

    if (active) advance("quest-open");
    navigate("/qr-scanner", { replace: active });
  };

  return (
    <button
      className="quest-card quest-slot"
      // 上のカードほど手前に重ねる（押したときに少し浮く動きで隠れないように）
      style={{ top: QUEST_CARD_FIRST_TOP + index * QUEST_CARD_PITCH, "--quest-card-z": 30 - index } as CSSProperties}
      type="button"
      data-tutorial-quest={quest.id}
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

        <h2 className="quest-title" data-tutorial="quest">
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
                {area?.buildingName ?? "練習フィールド"}
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

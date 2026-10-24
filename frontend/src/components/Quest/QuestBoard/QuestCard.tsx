import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";

import type { Quest } from "../../../types/quest";
import { useGameTutorial } from "../../Tutorial/useGameTutorial";
import { getMaterial } from "../../../data/materials";

import "./QuestCard.css";

type QuestCardProps = {
  quest: Quest;
  // 掲示板の上から何枚目か（0から）。位置と重なり順をこの番号から決める
  index: number;
  // クエストの建物名（見つからないときは「練習フィールド」と出す）
  buildingName?: string;
};

function QuestCard({
  quest,
  index,
  buildingName,
}: QuestCardProps) {
  const navigate = useNavigate();
  const { active, advance } = useGameTutorial();

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
      // 何枚目かを CSS に渡し、位置と重なり順（上のカードほど手前）を QuestCard.css で決める
      style={{ "--quest-index": index } as CSSProperties}
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

        <dl className="quest-info">

          <div className="quest-info-item">
            <dt className="quest-info-label">AREA</dt>
            <dd>{buildingName ?? "練習フィールド"}</dd>
          </div>

          {/* 報酬の素材は、アイコンと数で並べる（名前は読み上げ用） */}
          <div className="quest-info-item">
            <dt className="quest-info-label">REWARD</dt>
            <dd className="quest-rewards">
              {quest.rewardMaterials.map((reward) => {
                const material = getMaterial(reward.id);
                return (
                  <span key={reward.id} className="quest-reward" title={material.name}>
                    <img src={material.image} alt={material.name} />
                    <span>×{reward.amount}</span>
                  </span>
                );
              })}
            </dd>
          </div>

        </dl>


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

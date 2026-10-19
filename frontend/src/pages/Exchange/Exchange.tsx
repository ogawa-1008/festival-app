import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useGame } from "../../context/GameContext";
import { progressData } from "../../data/progress";
import { useGameTutorial } from "../../components/Tutorial/useGameTutorial";

import "./Exchange.css";

function Exchange() {
  const navigate = useNavigate();
  const { materials, weaponClaimed, claimWeapon } = useGame();
  const { active: practice, step, advance } = useGameTutorial();
  const [isConfirming, setIsConfirming] = useState(practice && step === "confirm");
  const [isClaimed, setIsClaimed] = useState(false);

  const hasEnoughMaterials = progressData.materials.every(
    (material) => (materials[material.id] ?? 0) >= material.required
  );

  const handleExchange = () => {
    if (claimWeapon()) {
      setIsConfirming(false);
      setIsClaimed(true);
      if (practice) advance("exchange-confirmed");
    }
  };

  return (
    <main className="exchange-page">
      <section className="exchange-card">
        <span className="exchange-eyebrow">REWARD EXCHANGE</span>
        <h1>{progressData.weaponName} ピンバッジ</h1>
        <img
          src={progressData.weaponImage}
          alt={progressData.weaponName}
          className="exchange-image"
        />

        {isClaimed || weaponClaimed ? (
          <div className="exchange-complete">
            <h2>{practice ? "交換の練習ができました" : "交換済みです"}</h2>
            <p>{practice
              ? "これは練習用の画面です。実際の特典は受け取れません。本番では交換済み画面を運営スタッフに提示してください。"
              : "運営スタッフにこの画面を提示して、ピンバッジを受け取ってください。"}</p>
          </div>
        ) : (
          <>
            <div className="exchange-materials">
              {progressData.materials.map((material) => (
                <p key={material.id}>
                  <span>{material.name}</span>
                  <strong>{materials[material.id] ?? 0} / {material.required}</strong>
                </p>
              ))}
            </div>
            <button
              type="button"
              className="exchange-primary"
              data-tutorial="exchange-open"
              disabled={!hasEnoughMaterials}
              onClick={() => {
                setIsConfirming(true);
                if (practice) advance("exchange-open");
              }}
            >
              {hasEnoughMaterials ? "特典と交換する" : "素材が不足しています"}
            </button>
          </>
        )}

        <button type="button" className="exchange-back" data-tutorial="exchange-back" onClick={() => {
          if (practice) advance("exchange-back");
          navigate("/progress", { replace: practice });
        }}>
          武器詳細へ戻る
        </button>
      </section>

      {isConfirming && (
        <div className="exchange-modal" role="dialog" aria-modal="true" aria-labelledby="exchange-title">
          <div>
            <h2 id="exchange-title">交換しますか？</h2>
            <p>素材を消費すると、同じ特典はもう交換できません。</p>
            <div className="exchange-modal-actions">
              <button type="button" onClick={() => setIsConfirming(false)}>キャンセル</button>
              <button type="button" data-tutorial="exchange-confirm" onClick={handleExchange}>交換する</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Exchange;

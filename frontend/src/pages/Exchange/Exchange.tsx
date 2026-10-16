import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useGame } from "../../context/GameContext";
import { progressData } from "../../data/progress";

import "./Exchange.css";

function Exchange() {
  const navigate = useNavigate();
  const { materials, weaponClaimed, claimWeapon } = useGame();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);

  const hasEnoughMaterials = progressData.materials.every(
    (material) => (materials[material.id] ?? 0) >= material.required
  );

  const handleExchange = () => {
    if (claimWeapon()) {
      setIsConfirming(false);
      setIsClaimed(true);
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
            <h2>交換済みです</h2>
            <p>運営スタッフにこの画面を提示して、ピンバッジを受け取ってください。</p>
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
              disabled={!hasEnoughMaterials}
              onClick={() => setIsConfirming(true)}
            >
              {hasEnoughMaterials ? "特典と交換する" : "素材が不足しています"}
            </button>
          </>
        )}

        <button type="button" className="exchange-back" onClick={() => navigate("/progress")}>
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
              <button type="button" onClick={handleExchange}>交換する</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Exchange;

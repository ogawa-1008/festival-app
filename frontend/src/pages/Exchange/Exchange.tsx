import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import SwipeToConfirm from "../../components/SwipeToConfirm/SwipeToConfirm";
import { useGame } from "../../context/GameContext";
import { progressData } from "../../data/progress";
import { useGameTutorial } from "../../components/Tutorial/useGameTutorial";

import "./Exchange.css";

function Exchange() {
  const navigate = useNavigate();
  const { materials, weaponClaimed, requiresUpdate, claimWeapon } = useGame();
  const { active: practice, step, advance } = useGameTutorial();
  const [isConfirming, setIsConfirming] = useState(practice && step === "confirm");
  // 「交換完了」を見せている間（キャンセル不可）
  const [isFinishing, setIsFinishing] = useState(false);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
  }, []);

  const hasEnoughMaterials = progressData.materials.every(
    (material) => (materials[material.id] ?? 0) >= material.required
  );

  // スワイプで確定したら交換し、「交換完了」を少し見せてから交換済み画面にする
  const handleExchange = () => {
    if (!claimWeapon()) return false;

    setIsFinishing(true);
    if (practice) advance("exchange-confirmed");
    // 交換済みの表示は weaponClaimed で切り替わる。ここでは確認画面を閉じるだけ
    finishTimerRef.current = setTimeout(() => {
      setIsConfirming(false);
      setIsFinishing(false);
    }, 900);

    return true;
  };

  return (
    <main className="exchange-page">
      <section className="exchange-card">
        <span className="exchange-eyebrow">REWARD EXCHANGE</span>
        <h1>{progressData.weaponName} スマホ壁紙</h1>
        <img
          src={progressData.weaponImage}
          alt={progressData.weaponName}
          className="exchange-image"
        />

        {weaponClaimed ? (
          <div className="exchange-complete">
            <h2>{practice ? "交換の練習ができました" : "交換済みです"}</h2>
            <p>{practice ? "これは練習用の画面です。実際の特典は受け取れません。本番では交換済み画面を運営スタッフに提示してください。" : "運営スタッフにこの画面を提示して、スマホ壁紙を受け取ってください。"}</p>
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
              disabled={!hasEnoughMaterials || requiresUpdate}
              onClick={() => { setIsConfirming(true); if (practice) advance("exchange-open"); }}
            >
              {hasEnoughMaterials ? "特典と交換する" : "素材が不足しています"}
            </button>
          </>
        )}
        <button type="button" className="exchange-back" data-tutorial={!isConfirming ? "exchange-back" : undefined} onClick={() => {
          if (practice) advance("exchange-back");
          navigate("/progress", { replace: practice });
        }}>
          武器詳細へ戻る
        </button>
      </section>

      {isConfirming && (
        <div className="exchange-modal" role="dialog" aria-modal="true" aria-labelledby="exchange-title">
          <div>
            <h2 id="exchange-title">
              {isFinishing ? "交換が完了しました" : "交換しますか？"}
            </h2>
            <p>素材を消費すると、同じ特典はもう交換できません。</p>
            <div className="exchange-modal-actions">
              <div data-tutorial="exchange-confirm">
              <SwipeToConfirm
                label="右にスライドして交換"
                confirmedLabel="交換完了"
                disabled={requiresUpdate}
                onConfirm={handleExchange}
              />
              </div>
              <button
                type="button"
                className="exchange-modal-cancel"
                onClick={() => setIsConfirming(false)}
                disabled={isFinishing}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Exchange;

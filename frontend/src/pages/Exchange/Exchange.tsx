import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import SwipeToConfirm from "../../components/SwipeToConfirm/SwipeToConfirm";
import { useGame } from "../../context/GameContext";
import { progressData } from "../../data/progress";
import { useGameTutorial } from "../../components/Tutorial/useGameTutorial";
import { getWeaponAttackBonus } from "../../utils/playerStats";
import { getOwnedMaterial, hasEnoughWeaponMaterials } from "../../utils/weaponMaterials";

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

  const attackBonus = getWeaponAttackBonus();

  const hasEnoughMaterials = hasEnoughWeaponMaterials(materials);

  // スワイプで確定したら武器を作成し、「作成完了」を少し見せてから作成済み画面にする
  const handleExchange = () => {
    if (!claimWeapon()) return false;

    setIsFinishing(true);
    if (practice) advance("exchange-confirmed");
    // 作成済みの表示は weaponClaimed で切り替わる。ここでは確認画面を閉じるだけ
    finishTimerRef.current = setTimeout(() => {
      setIsConfirming(false);
      setIsFinishing(false);
    }, 900);

    return true;
  };

  return (
    <main className="exchange-page">
      <section className="exchange-card">
        <span className="exchange-eyebrow">WEAPON CRAFT</span>
        <h1>{progressData.weaponName}</h1>
        <img
          src={progressData.weaponImage}
          alt={progressData.weaponName}
          className="exchange-image"
        />

        {weaponClaimed ? (
          <div className="exchange-complete">
            <h2>{practice ? "作成の練習ができました" : "作成済みです"}</h2>
            <p>
              攻撃力が +{attackBonus} 上がりました。モンスターに与えるダメージが増えます。
              {practice && "（練習用の画面です。本番の攻撃力には影響しません）"}
            </p>
          </div>
        ) : (
          <>
            <p className="exchange-effect">
              作成すると攻撃力が +{attackBonus} 上がります
            </p>
            <div className="exchange-materials">
              {progressData.materials.map((material) => (
                <p key={material.id}>
                  <span>{material.name}</span>
                  <strong>{getOwnedMaterial(materials, material.id)} / {material.required}</strong>
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
              {hasEnoughMaterials ? "武器を作成する" : "素材が不足しています"}
            </button>
          </>
        )}
        <button type="button" className="exchange-back" data-tutorial={!isConfirming ? "exchange-back" : undefined} onClick={() => {
          if (practice) advance("exchange-back");
          navigate("/progress/weapons", { replace: practice });
        }}>
          武器詳細へ戻る
        </button>
      </section>

      {isConfirming && (
        <div className="exchange-modal" role="dialog" aria-modal="true" aria-labelledby="exchange-title">
          <div>
            <h2 id="exchange-title">
              {isFinishing ? "武器を作成しました" : "武器を作成しますか？"}
            </h2>
            <p>素材を消費して{progressData.weaponName}を作成します。作成は1回だけです。</p>
            <div className="exchange-modal-actions">
              <div data-tutorial="exchange-confirm">
              <SwipeToConfirm
                label="右にスライドして作成"
                confirmedLabel="作成完了"
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

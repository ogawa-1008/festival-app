import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import SwipeToConfirm from "../../components/SwipeToConfirm/SwipeToConfirm";
import { useGame } from "../../context/GameContext";
import { useGameTutorial } from "../../components/Tutorial/useGameTutorial";
import { getWeaponAttack } from "../../utils/playerStats";
import { canUpgradeWeapon, formatZenny, getCurrentWeapon, getNextWeapon } from "../../utils/weaponUpgrade";
import type { Weapon } from "../../data/weapons";
import { playSe } from "../../utils/sound";

import "./Exchange.css";

// 武器の強化（次の段階の武器・必要なゼニーを確認して、スライドで強化する）
function Exchange() {
  const navigate = useNavigate();
  const { zenny, weaponLevel, requiresUpdate, upgradeWeapon } = useGame();
  const { active: practice, minimized, step, advance } = useGameTutorial();
  const [isConfirming, setIsConfirming] = useState(false);
  // 練習で「スライドして強化」のガイドを出すときは、確認ダイアログを開く
  // （ガイドを閉じてダイアログをキャンセルしたあと、再開してもダイアログが出ないままにならないように）
  if (practice && !minimized && step === "confirm" && !isConfirming) setIsConfirming(true);
  // 「強化完了」を見せている間（キャンセル不可）
  const [isFinishing, setIsFinishing] = useState(false);
  // この画面で強化したときの、強化前と強化後の武器（強化すると次の段階が変わるため、押したときの武器を覚えておく）
  const [upgraded, setUpgraded] = useState<{ from: Weapon; to: Weapon } | null>(null);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
  }, []);

  const current = getCurrentWeapon(weaponLevel);
  const next = getNextWeapon(weaponLevel);
  const canUpgrade = canUpgradeWeapon({ weaponLevel, zenny });

  // 「攻撃力 10 → 11 (+1)」のように、強化前と強化後の攻撃力を並べる
  const attackChange = (from: Weapon, to: Weapon) =>
    `${getWeaponAttack(from)} → ${getWeaponAttack(to)} (+${to.attackBonus - from.attackBonus})`;

  // 確認ダイアログ・強化完了で見せる武器（強化した直後は、強化した武器のまま見せる）
  const shown = upgraded ?? (next ? { from: current, to: next } : null);

  // スワイプで確定したら強化し、「強化完了」を少し見せてから強化した画面にする
  const handleUpgrade = () => {
    if (!next) return false;
    const target = { from: current, to: next };
    if (!upgradeWeapon()) return false;
    playSe("weaponUpgrade");

    setUpgraded(target);
    setIsFinishing(true);
    if (practice) advance("exchange-confirmed");
    finishTimerRef.current = setTimeout(() => {
      setIsConfirming(false);
      setIsFinishing(false);
    }, 900);

    return true;
  };

  return (
    <main className="exchange-page">
      <section className="exchange-card">
        <span className="exchange-eyebrow">WEAPON UPGRADE</span>
        <h1>{shown?.to.name ?? current.name}</h1>
        <div className={`exchange-image-frame${upgraded && !isConfirming ? " is-powered" : ""}`}>
          <img
            src={shown?.to.image ?? current.image}
            alt={shown?.to.name ?? current.name}
            className="exchange-image"
          />
          {upgraded && !isConfirming && (
            <span className="exchange-attack-up" role="status">
              <span aria-hidden="true">↑</span> 攻撃力 +{upgraded.to.attackBonus - upgraded.from.attackBonus}
            </span>
          )}
        </div>

        {upgraded && !isConfirming ? (
          <div className="exchange-complete">
            <h2>{practice ? "強化の練習ができました" : "強化しました"}</h2>
            <p>
              {upgraded.to.name}に強化しました。攻撃力 {attackChange(upgraded.from, upgraded.to)}。モンスターに与えるダメージが増えます。
              {practice && "（練習用の画面です。本番の武器・ゼニーには影響しません）"}
            </p>
            {/* 次の段階があれば、この画面のまま次の強化を確認できる */}
            {!practice && next && (
              <button type="button" className="exchange-primary exchange-next" onClick={() => setUpgraded(null)}>
                次の強化を見る
              </button>
            )}
          </div>
        ) : !next ? (
          <div className="exchange-complete">
            <h2>最終段階まで強化済みです</h2>
            <p>これ以上は強化できません。</p>
          </div>
        ) : (
          <>
            <p className="exchange-effect">
              攻撃力 {attackChange(current, next)}
            </p>
            <div className="exchange-materials">
              <p>
                <span>{current.name} → {next.name}</span>
              </p>
              <p>
                <span>必要なゼニー</span>
                <strong>{formatZenny(next.upgradeCost)}</strong>
              </p>
              <p>
                <span>持っているゼニー</span>
                <strong>{formatZenny(zenny)}</strong>
              </p>
            </div>
            <button
              type="button"
              className="exchange-primary"
              data-tutorial="exchange-open"
              disabled={!canUpgrade || requiresUpdate}
              onClick={() => { setIsConfirming(true); if (practice) advance("exchange-open"); }}
            >
              {canUpgrade ? "武器を強化する" : "ゼニーが不足しています"}
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

      {isConfirming && shown && (
        <div className="exchange-modal" role="dialog" aria-modal="true" aria-labelledby="exchange-title">
          <div>
            <h2 id="exchange-title">
              {isFinishing ? "武器を強化しました" : "武器を強化しますか？"}
            </h2>
            <p>{formatZenny(shown.to.upgradeCost)}を使って、{shown.from.name}を{shown.to.name}に{isFinishing ? "強化しました" : "強化します"}。</p>
            <p className="exchange-modal-attack">
              攻撃力 {attackChange(shown.from, shown.to)}
            </p>
            <div className="exchange-modal-actions">
              <div data-tutorial="exchange-confirm">
              <SwipeToConfirm
                label="右にスライドして強化"
                confirmedLabel="強化完了"
                disabled={requiresUpdate}
                onConfirm={handleUpgrade}
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

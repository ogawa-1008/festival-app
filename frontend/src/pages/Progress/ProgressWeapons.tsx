import { useGame } from "../../context/GameContext";
import { useNavigate } from "react-router-dom";

import BottomNavigation from "../../components/Navigation/BottomNavigation";
import { useGameTutorial } from "../../components/Tutorial/useGameTutorial";
import { MAX_WEAPON_LEVEL, REWARD_ZENNY } from "../../data/weapons";
import { canUpgradeWeapon, formatZenny, getCurrentWeapon, getNextWeapon } from "../../utils/weaponUpgrade";
import { getWeaponAttack } from "../../utils/playerStats";
import ProgressActionButton from "./ProgressActionButton";
import ProgressSubHeader from "./ProgressSubHeader";

import "./Progress.css";

// 進捗：武器の強化（今の武器・次の武器と必要なゼニー）
function ProgressWeapons() {
  const { zenny, weaponLevel, requiresUpdate } = useGame();
  const navigate = useNavigate();
  const { active, advance } = useGameTutorial();

  const weapon = getCurrentWeapon(weaponLevel);
  const next = getNextWeapon(weaponLevel);
  const canUpgrade = canUpgradeWeapon({ weaponLevel, zenny });

  const handleUpgrade = () => {
    if (active) advance("craft-open");
    navigate("/exchange/weapon", { replace: active });
  };

  return (
    <main className="progress-page">
      <div className="progress-content">
        <ProgressSubHeader eyebrow="WEAPON UPGRADE" title="武器を強化する" />

        {/* =========================
            今の武器
        ========================= */}
        <section className="weapon-area">

          <div className="weapon-title-frame">
            <h2>{weapon.name}</h2>
          </div>

          <div className="weapon-image-area">
            <img
              src={weapon.image}
              alt={weapon.name}
              className="weapon-image"
            />
          </div>

          <p className="weapon-stage">
            強化 {weaponLevel} / {MAX_WEAPON_LEVEL} 段階・攻撃力 {getWeaponAttack(weapon)}
          </p>
        </section>


        {/* =========================
            次の強化
        ========================= */}
        <section className="materials-area">

          <div className="decorative-title">
            <span className="decorative-line left" />

            <h2>次の強化</h2>

            <span className="decorative-line right" />
          </div>

          {next ? (
            <div className="materials-list">
              <div className={`material-row ${zenny >= next.upgradeCost ? "material-enough" : "material-not-enough"}`}>

                {/* 次の武器の画像 */}
                <div className="material-image-frame">
                  <img src={next.image} alt="" className="material-image" />
                </div>

                {/* 次の武器・必要なゼニー */}
                <div className="material-main">
                  <h3>{next.name}</h3>

                  <div className="material-required">
                    <span className="material-x">攻撃力</span>
                    <span>{getWeaponAttack(weapon)} → {getWeaponAttack(next)}（+{next.attackBonus - weapon.attackBonus}）</span>
                  </div>

                  <div className="material-required">
                    <span className="material-x">必要</span>
                    <span>{formatZenny(next.upgradeCost)}</span>
                  </div>
                </div>

                {/* 持っているゼニー */}
                <div className="material-owned">
                  <span className="owned-icon">持っている</span>
                  <span className="owned-number">{formatZenny(zenny)}</span>
                </div>

              </div>
            </div>
          ) : (
            <p className="progress-reward-note">最終段階まで強化しました。</p>
          )}

          {next && !canUpgrade && (
            <p className="progress-reward-note">
              ゼニーは、マップにいるモンスターを討伐（{formatZenny(REWARD_ZENNY.victory)}）・調査（{formatZenny(REWARD_ZENNY.failure)}）するともらえます。
            </p>
          )}

        </section>

        {/* ゼニーが足りないとき・最終段階のとき・アプリの更新が必要なときは押せない */}
        <ProgressActionButton
          label={!next
            ? "最終段階まで強化済み"
            : requiresUpdate
              ? "アプリを更新してください"
              : canUpgrade ? "武器を強化する" : "ゼニーが足りません"}
          disabled={!next || requiresUpdate || !canUpgrade}
          onClick={handleUpgrade}
          tutorialId="create-weapon"
        />

      </div>


      {/* =========================
          下部ナビ
      ========================= */}
      <BottomNavigation active="progress" />

    </main>
  );
}

export default ProgressWeapons;

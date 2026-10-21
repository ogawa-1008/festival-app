import { useGame } from "../../context/GameContext";
import { progressData } from "../../data/progress";
import { useNavigate } from "react-router-dom";

import BottomNavigation from "../../components/Navigation/BottomNavigation";
import { useGameTutorial } from "../../components/Tutorial/useGameTutorial";
import { getOwnedMaterial, hasEnoughWeaponMaterials } from "../../utils/weaponMaterials";
import ProgressActionButton from "./ProgressActionButton";
import ProgressSubHeader from "./ProgressSubHeader";

import "./Progress.css";

// 進捗：武器の作成（今の武器・必要素材）
function ProgressWeapons() {
  const { materials, weaponClaimed, requiresUpdate } = useGame();
  const navigate = useNavigate();
  const { active, advance } = useGameTutorial();

  const hasEnoughMaterials = hasEnoughWeaponMaterials(materials);

  const handleCreateWeapon = () => {
    if (active) advance("craft-open");
    navigate("/exchange/weapon", { replace: active });
  };

  return (
    <main className="progress-page">
      <div className="progress-content">
        <ProgressSubHeader eyebrow="WEAPON CRAFT" title="武器を作る" />

        {/* =========================
            武器
        ========================= */}
        <section className="weapon-area">

          <div className="weapon-title-frame">
            <h2>{progressData.weaponName}</h2>
          </div>

          <div className="weapon-image-area">
            <img
              src={progressData.weaponImage}
              alt={progressData.weaponName}
              className="weapon-image"
            />
          </div>
        </section>


        {/* =========================
            必要素材
        ========================= */}
        <section className="materials-area">

          <div className="decorative-title" data-tutorial="required-materials">
            <span className="decorative-line left" />

            <h2>必要素材</h2>

            <span className="decorative-line right" />
          </div>


          <div className="materials-list">

            {progressData.materials.map((material) => {
              const owned = getOwnedMaterial(materials, material.id);

              const isEnough =
                owned >= material.required;

              return (
                <div
                  key={material.id}
                  className={`material-row ${isEnough
                    ? "material-enough"
                    : "material-not-enough"
                    }`}
                >

                  {/* 素材画像 */}
                  <div className="material-image-frame">
                    <img
                      src={material.image}
                      alt={material.name}
                      className="material-image"
                    />
                  </div>


                  {/* 素材名・必要数 */}
                  <div className="material-main">

                    <h3>
                      {material.name}
                    </h3>

                    <div className="material-required">
                      <span className="material-x">
                        必要
                      </span>

                      <span>
                        {material.required}
                      </span>
                    </div>

                  </div>


                  {/* 所持数 */}
                  <div className="material-owned">

                    <span className="owned-icon">
                      持っている
                    </span>

                    <span className="owned-number">
                      {owned}
                    </span>

                  </div>

                </div>
              );
            })}

          </div>

          {!weaponClaimed && !hasEnoughMaterials && (
            <p className="progress-reward-note">
              足りない素材は、マップにいるモンスターを討伐・調査するともらえます。
            </p>
          )}

        </section>

        {/* 素材が足りないとき・作成済みのとき・アプリの更新が必要なときは押せない */}
        <ProgressActionButton
          label={weaponClaimed
            ? "作成済み"
            : requiresUpdate
              ? "アプリを更新してください"
              : hasEnoughMaterials ? "武器を作成する" : "素材が足りません"}
          disabled={weaponClaimed || requiresUpdate || !hasEnoughMaterials}
          onClick={handleCreateWeapon}
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

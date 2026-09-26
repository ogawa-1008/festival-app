import { useGame } from "../../context/GameContext";
import { progressData } from "../../data/progress";
import { useNavigate } from "react-router-dom";

import BottomNavigation from "../../components/Navigation/BottomNavigation";

import "./Progress.css";

function Progress() {
  const { materials, weaponClaimed } = useGame();
  const navigate = useNavigate();

  const handleCreateWeapon = () => {
    const hasEnoughMaterials = progressData.materials.every((material) => {
      const owned = materials[material.id] ?? material.owned;

      return owned >= material.required;
    });

    if (!hasEnoughMaterials) {
      return;
    }

    navigate("/exchange/weapon");
  };

  return (
    <main className="progress-page">
      <div className="progress-content">

        {/* =========================
            武器
        ========================= */}
        <section className="weapon-area">

          <div className="weapon-title-frame">
            <h1>{progressData.weaponName}</h1>
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

          <div className="decorative-title">
            <span className="decorative-line left" />

            <h2>必要素材</h2>

            <span className="decorative-line right" />
          </div>


          <div className="materials-list">

            {progressData.materials.map((material) => {
              const owned =
                materials[material.id] ?? material.owned;

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
                        ×
                      </span>

                      <span>
                        {material.required}
                      </span>
                    </div>

                  </div>


                  {/* 所持数 */}
                  <div className="material-owned">

                    <span className="owned-icon">
                      ▤
                    </span>

                    <span className="owned-number">
                      {owned}
                    </span>

                  </div>

                </div>
              );
            })}

          </div>

        </section>


        {/* =========================
            必要費用
        ========================= */}
        <section className="money-area">

          <div className="decorative-title">
            <span className="decorative-line left" />

            <h2>必要費用</h2>

            <span className="decorative-line right" />
          </div>


          <div className="money-content">

            <div className="money-icon">
              Z
            </div>

            <div className="money-number">
              {progressData.requiredMoney.toLocaleString()}
            </div>

            <div className="money-unit">
              z
            </div>

          </div>

        </section>

        <section className="create-weapon-area">

          <button
            type="button"
            className="create-weapon-button"
            onClick={handleCreateWeapon}
          >
            {weaponClaimed ? "交換済み" : "武器を作成する"}
          </button>
          
        </section>

      </div>


      {/* =========================
          下部ナビ
      ========================= */}
      <BottomNavigation active="progress" />

    </main>
  );
}

export default Progress;

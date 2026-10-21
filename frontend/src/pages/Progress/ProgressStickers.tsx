import BottomNavigation from "../../components/Navigation/BottomNavigation";
import { StickerIcon } from "../../components/FieldCollection/FieldCollection";
import { useGameTutorial } from "../../components/Tutorial/useGameTutorial";
import { useGame } from "../../context/GameContext";
import { useMapAreas } from "../../context/useMapAreas";
import { getFieldProgress } from "../../utils/fieldProgress";
import ProgressActionButton from "./ProgressActionButton";
import ProgressSubHeader from "./ProgressSubHeader";

import "./Progress.css";

// 進捗：フィールドのステッカーをもらう（武器の作成ページと同じ部品で組む）
function ProgressStickers() {
  const { quests, obtainedFieldNoveltyIds } = useGame();
  const mapAreas = useMapAreas();
  const { active: practice } = useGameTutorial();

  return (
    <main className="progress-page">
      <div className="progress-content">
        <ProgressSubHeader eyebrow="FIELD REWARD" title="ステッカーをもらう" />

        <section className="materials-area" aria-labelledby="sticker-list-title">
          <div className="decorative-title">
            <span className="decorative-line left" />
            <h2 id="sticker-list-title">ステッカー一覧</h2>
            <span className="decorative-line right" />
          </div>

          <ul className="progress-reward-list">
            {mapAreas.map((area) => {
              const progress = getFieldProgress(area, quests, obtainedFieldNoveltyIds);

              const canRedeem = progress.redeemable && !practice;
              const remaining = progress.total - progress.attempted;
              // 押せないときは、理由や次にすることをボタンの文字で伝える
              const label = progress.noveltyObtained
                ? "✓ もらいました"
                : !progress.available
                  ? "このフィールドは準備中です"
                  : progress.redeemable && practice
                    ? "練習中はもらえません"
                    : progress.redeemable
                      ? "ステッカーをもらう"
                      : `あと ${remaining} 体でもらえます`;

              return (
                <li key={area.id} className="progress-reward-item">
                  <div className={`material-row ${progress.noveltyObtained || canRedeem ? "material-enough" : ""}`}>
                    <div className="material-image-frame progress-reward-icon" aria-hidden="true">
                      {area.novelty.image
                        ? <img className="material-image" src={area.novelty.image} alt="" />
                        : <StickerIcon />}
                    </div>

                    <div className="material-main">
                      <h3>{area.novelty.name}</h3>
                      <p className="progress-reward-sub">交換場所：{area.novelty.redemptionLocation}</p>
                    </div>

                    {/* 討伐・調査したモンスターの数 */}
                    <div className="progress-reward-state">
                      {progress.noveltyObtained ? null : progress.available ? (
                        <span className="progress-reward-pending">
                          <span className="progress-reward-pending-label">討伐・調査</span>
                          {progress.attempted} / {progress.total} 体
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <ProgressActionButton
                    label={label}
                    disabled={!canRedeem || progress.noveltyObtained}
                    to={`/novelty/${area.id}`}
                    compact
                  />
                </li>
              );
            })}
          </ul>

        </section>
      </div>

      <BottomNavigation active="progress" />
    </main>
  );
}

export default ProgressStickers;

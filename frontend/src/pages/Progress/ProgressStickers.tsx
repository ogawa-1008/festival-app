import BottomNavigation from "../../components/Navigation/BottomNavigation";
import { StickerIcon } from "../../components/FieldCollection/FieldCollection";
import { useGameTutorial } from "../../components/Tutorial/useGameTutorial";
import { useGame } from "../../context/GameContext";
import { useMapAreas } from "../../context/useMapAreas";
import { getStickerRedemptionText } from "../../data/maps";
import { STICKER } from "../../data/sticker";
import { getFieldProgress, getStampRallyProgress } from "../../utils/fieldProgress";
import ProgressActionButton from "./ProgressActionButton";
import ProgressSubHeader from "./ProgressSubHeader";

import "./Progress.css";

// 進捗：フィールド報酬のステッカー（1種類）。スマホ壁紙のページと同じ作りで、集めたスタンプと集め方を見せる
function ProgressStickers() {
  const { campusId, quests, obtainedFieldNoveltyIds } = useGame();
  const mapAreas = useMapAreas();
  const { active: practice } = useGameTutorial();

  const rally = getStampRallyProgress(mapAreas, quests, obtainedFieldNoveltyIds);
  const reached = rally.remaining === 0;
  const percent = Math.round((Math.min(rally.earned, rally.required) / rally.required) * 100);
  // 今交換できるフォトスポット。どこでもらっても同じなので、ボタンは1つにして最初の場所の交換画面を開く
  const spot = mapAreas.find((area) => getFieldProgress(area, quests, obtainedFieldNoveltyIds, mapAreas).redeemable);
  const location = getStickerRedemptionText(campusId);

  return (
    <main className="progress-page">
      <div className="progress-content">
        <ProgressSubHeader eyebrow="FIELD REWARD" title="ステッカーをもらう" />

        <section className="materials-area" aria-labelledby="sticker-stamp-title">
          <div className="decorative-title">
            <span className="decorative-line left" />
            <h2 id="sticker-stamp-title">集めたスタンプ</h2>
            <span className="decorative-line right" />
          </div>

          <div className="materials-list">
            <div className={`material-row ${reached ? "material-enough" : ""}`}>
              <div className="material-image-frame progress-reward-icon" aria-hidden="true">
                {STICKER.image
                  ? <img className="material-image" src={STICKER.image} alt="" />
                  : <StickerIcon />}
              </div>

              <div className="material-main">
                <h3>{STICKER.name}</h3>
                <p className="progress-reward-sub">スタンプ {rally.required} つで1枚</p>
                {/* 表示だけのバー（ブラウザ標準の progress は押せる部品のように見えるため使わない） */}
                <div
                  className="wallpaper-progress"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percent}
                  aria-label="ステッカーまでのスタンプの数"
                >
                  <div className="wallpaper-progress-fill" style={{ width: `${percent}%` }} />
                </div>
              </div>

              <div className="material-owned">
                <span className="owned-icon">スタンプ</span>
                <span className="owned-number">
                  {rally.earned}
                  <span className="wallpaper-rank-of"> / {rally.required}</span>
                </span>
              </div>
            </div>
          </div>

          <p className="progress-reward-note">
            {rally.redeemed
              ? "ステッカーは1枚もらいました。"
              : reached
                ? practice
                  ? `スタンプが${rally.required}つ集まりました！（練習中はステッカーと交換できません）`
                  : `スタンプが${rally.required}つ集まりました！ ${location}へ行って、ステッカーと交換しましょう。`
                : `あと ${rally.remaining} 校舎のスタンプでステッカーと交換できます`}
          </p>
          {!reached && !rally.redeemed && <p className="progress-reward-note">交換場所：{location}</p>}
        </section>

        {!reached && !rally.redeemed && (
          <section className="materials-area" aria-labelledby="sticker-howto-title">
            <div className="decorative-title">
              <span className="decorative-line left" />
              <h2 id="sticker-howto-title">スタンプの集め方</h2>
              <span className="decorative-line right" />
            </div>

            <ol className="progress-steps">
              <li>マップで、モンスターのいるフィールドを確かめる</li>
              <li>会場のQRコードを読み取って、モンスターに挑戦する</li>
              <li>
                討伐か調査を終えると、その校舎のスタンプがもらえます
                <small>同じ校舎のスタンプは1つまで。ちがう3校舎で集めましょう</small>
              </li>
            </ol>
          </section>
        )}

        {/* まだ足りないときは、スタンプを集めるための次の行動へ案内する */}
        {rally.redeemed ? (
          <ProgressActionButton label="✓ もらいました" disabled />
        ) : !reached ? (
          <ProgressActionButton label="マップでモンスターを探す" to="/map" />
        ) : practice ? (
          <ProgressActionButton label="練習中はもらえません" disabled />
        ) : spot ? (
          <ProgressActionButton label="ステッカーをもらう" to={`/novelty/${spot.id}`} />
        ) : (
          <ProgressActionButton label="交換できる場所が見つかりません" disabled />
        )}
      </div>

      <BottomNavigation active="progress" />
    </main>
  );
}

export default ProgressStickers;

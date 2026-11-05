import BottomNavigation from "../../components/Navigation/BottomNavigation";
import { StickerIcon } from "../../components/FieldCollection/FieldCollection";
import { useGameTutorial } from "../../components/Tutorial/useGameTutorial";
import { useGame } from "../../context/GameContext";
import { useMapAreas } from "../../context/useMapAreas";
import { STICKER } from "../../data/sticker";
import { getFieldProgress, getStampRallyProgress, getStampRallyState } from "../../utils/fieldProgress";
import ProgressActionButton from "./ProgressActionButton";
import ProgressSubHeader from "./ProgressSubHeader";

import "./Progress.css";

// 進捗：フィールド報酬のステッカー（1種類）。スマホ壁紙のページと同じ作りで、集めたスタンプと集め方を見せる
function ProgressStickers() {
  const { quests, obtainedFieldNoveltyIds } = useGame();
  const mapAreas = useMapAreas();
  const { active: practice } = useGameTutorial();

  const rally = getStampRallyProgress(mapAreas, quests, obtainedFieldNoveltyIds);
  const state = getStampRallyState(rally);
  const reached = rally.remaining === 0;
  const percent = Math.round((Math.min(rally.earned, rally.required) / rally.required) * 100);
  const stateLabel = state === "redeemed"
    ? "✓ 交換済み"
    : state === "redeemable"
      ? practice ? "練習中" : "交換できます"
      : "集めています";
  // 今交換できるフォトスポット。どこでもらっても同じなので、ボタンは1つにして最初の場所の交換画面を開く
  const spot = mapAreas.find((area) => getFieldProgress(area, quests, obtainedFieldNoveltyIds, mapAreas).redeemable);

  return (
    <main className="progress-page">
      <div className="progress-content">
        <ProgressSubHeader eyebrow="STICKER" title="ステッカーをもらう" />

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
                <div className="sticker-title-row">
                  <h3>{STICKER.name}</h3>
                  <span className={`sticker-state-chip sticker-state-chip--${state}${practice && state === "redeemable" ? " is-practice" : ""}`}>
                    {stateLabel}
                  </span>
                </div>
                <p className="progress-reward-sub">スタンプ {rally.required} つで1枚</p>
                <div className="sticker-stamp-slots" aria-hidden="true">
                  {Array.from({ length: rally.required }, (_, index) => (
                    <span key={index} className={index < Math.min(rally.earned, rally.required) ? "is-earned" : ""}>
                      {index < Math.min(rally.earned, rally.required) ? "✓" : index + 1}
                    </span>
                  ))}
                </div>
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

          {state === "redeemable" ? (
            <div className="sticker-status sticker-status--ready" role="status">
              <span className="sticker-status-icon" aria-hidden="true">✓</span>
              <div>
                <strong>スタンプ3つ達成！</strong>
                <p>
                  {practice
                    ? "練習中はステッカーと交換できません。"
                    : "ステッカー1枚と交換できます。下のボタンから交換してください。"}
                </p>
              </div>
            </div>
          ) : state === "redeemed" ? (
            <div className="sticker-status sticker-status--done" role="status">
              <span className="sticker-status-icon" aria-hidden="true">✓</span>
              <div>
                <strong>ステッカー交換済み</strong>
                <p>ステッカーは受け取り済みです。追加の交換はできません。</p>
              </div>
            </div>
          ) : (
            <p className="progress-reward-note">
              あと {rally.remaining} 校舎のスタンプで、どの号館のフォトスポットでもステッカーと引き換えできます
            </p>
          )}
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
          <ProgressActionButton label="✓ ステッカー交換済み" disabled />
        ) : !reached ? (
          <ProgressActionButton label="マップでモンスターを探す" to="/map" />
        ) : practice ? (
          <ProgressActionButton label="練習中は交換できません" disabled />
        ) : spot ? (
          <ProgressActionButton label="ステッカーと交換する" to={`/novelty/${spot.id}`} />
        ) : (
          <ProgressActionButton label="交換できる場所が見つかりません" disabled />
        )}
      </div>

      <BottomNavigation active="progress" />
    </main>
  );
}

export default ProgressStickers;

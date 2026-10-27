import BottomNavigation from "../../components/Navigation/BottomNavigation";
import { useGame } from "../../context/GameContext";
import { getWallpaperProgress } from "../../utils/hunterRankReward";
import ProgressActionButton from "./ProgressActionButton";
import ProgressSubHeader from "./ProgressSubHeader";

import "./Progress.css";

// 進捗：ハンターランクの報酬（スマホ壁紙）。武器の強化ページと同じ部品で組む
// 受け取るまでの楽しみにするため、壁紙の画像は見せない
// 受け取り・保存は別の作業で実装する
function ProgressWallpaper() {
  const { rankExp } = useGame();
  const wallpaper = getWallpaperProgress(rankExp);

  return (
    <main className="progress-page">
      <div className="progress-content">
        <ProgressSubHeader eyebrow="HUNTER RANK REWARD" title="スマホ壁紙をもらう" />

        <section className="materials-area" aria-labelledby="wallpaper-condition-title">
          <div className="decorative-title">
            <span className="decorative-line left" />
            <h2 id="wallpaper-condition-title">今のランク</h2>
            <span className="decorative-line right" />
          </div>

          <div className="materials-list">
            <div className={`material-row ${wallpaper.reached ? "material-enough" : ""}`}>
              <div className="material-image-frame progress-reward-icon" aria-hidden="true">
                <span className="wallpaper-rank-badge">★</span>
              </div>

              <div className="material-main">
                <h3>ハンターランク {wallpaper.requiredRank} まで</h3>
                {/* 表示だけのバー（ブラウザ標準の progress は押せる部品のように見えるため使わない） */}
                <div
                  className="wallpaper-progress"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={wallpaper.percent}
                  aria-label={`ハンターランク${wallpaper.requiredRank}までの進み具合`}
                >
                  <div
                    className="wallpaper-progress-fill"
                    style={{ width: `${wallpaper.percent}%` }}
                  />
                </div>
              </div>

              <div className="material-owned">
                <span className="owned-icon">今のランク</span>
                <span className="owned-number">
                  {wallpaper.rank}
                  <span className="wallpaper-rank-of"> / {wallpaper.requiredRank}</span>
                </span>
              </div>
            </div>
          </div>

          <p className="progress-reward-note">
            {wallpaper.reached
              ? `ハンターランク ${wallpaper.requiredRank} に到達しました！`
              : `あと ${wallpaper.remainingExp} 経験値でハンターランク ${wallpaper.requiredRank} になります`}
          </p>
        </section>

        {!wallpaper.reached && (
          <section className="materials-area" aria-labelledby="wallpaper-howto-title">
            <div className="decorative-title">
              <span className="decorative-line left" />
              <h2 id="wallpaper-howto-title">ランクの上げ方</h2>
              <span className="decorative-line right" />
            </div>

            <ol className="progress-steps">
              <li>マップで、モンスターのいるフィールドを確かめる</li>
              <li>クエストを選び、会場のQRコードを読み取って挑戦する</li>
              <li>
                モンスターを討伐すると経験値がもらえ、ハンターランクが上がります
                <small>倒しきれなかったときも「調査」として少しもらえます</small>
              </li>
            </ol>
          </section>
        )}

        {/* まだ届かないときは、ランクを上げるための次の行動へ案内する */}
        {wallpaper.reached ? (
          <ProgressActionButton label="受け取りは準備中です" disabled />
        ) : (
          <ProgressActionButton label="マップでモンスターを探す" to="/map" />
        )}
      </div>

      <BottomNavigation active="progress" />
    </main>
  );
}

export default ProgressWallpaper;

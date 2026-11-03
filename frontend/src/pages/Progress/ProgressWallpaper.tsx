import { Link } from "react-router-dom";
import BottomNavigation from "../../components/Navigation/BottomNavigation";
import { WALLPAPER_IDS, getWallpaperPreviewUrl } from "../../api/wallpaperApi";
import { useGame } from "../../context/GameContext";
import { getWallpaperProgress } from "../../utils/hunterRankReward";
import ProgressActionButton from "./ProgressActionButton";
import ProgressSubHeader from "./ProgressSubHeader";
import { Chevron, WallpaperImage, WallpaperInAppNotice } from "./WallpaperParts";

import "./Progress.css";

// 進捗：ハンターランクの報酬（スマホ壁紙）。武器の強化ページと同じ部品で組む
// 受け取るまでの楽しみにするため、ランクが届くまで壁紙の画像は見せない（読み込みもしない）
// 届いたら壁紙の一覧を出す。壁紙を押すと、その壁紙の画面（ProgressWallpaperDetail）で保存できる
// ホーム画面に設定する方法は、保存する壁紙の画面にだけ出す
// 一覧のカードに敷く画像は、ほかの IP の画像と同じく保存できない
function ProgressWallpaper() {
  const { rankExp } = useGame();
  const wallpaper = getWallpaperProgress(rankExp);

  return (
    <main className="progress-page">
      <div className="progress-content">
        <ProgressSubHeader eyebrow="WALLPAPER" title="スマホ壁紙をもらう" />

        {/* 今のランクは、受け取れるランクに届くまでだけ出す（届いたら、すぐ壁紙の一覧を見せる） */}
        {!wallpaper.reached && (
          <section className="materials-area" aria-labelledby="wallpaper-condition-title">
            <div className="decorative-title">
              <span className="decorative-line left" />
              <h2 id="wallpaper-condition-title">今のランク</h2>
              <span className="decorative-line right" />
            </div>

            <div className="materials-list">
              <div className="material-row">
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
              あと {wallpaper.remainingExp} 経験値でハンターランク {wallpaper.requiredRank} になります
            </p>
          </section>
        )}

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
          <section className="materials-area" aria-labelledby="wallpaper-list-title">
            <div className="decorative-title">
              <span className="decorative-line left" />
              <h2 id="wallpaper-list-title">壁紙を選ぶ</h2>
              <span className="decorative-line right" />
            </div>

            <WallpaperInAppNotice />
            <p className="progress-reward-note wallpaper-lead">
              全{WALLPAPER_IDS.length}種類。好きな壁紙を開いて保存しよう
            </p>

            {/* 縦に1列。カードの上に壁紙の一部分を切り抜いて敷き、下の帯に番号と「開く」を置く。押すとその壁紙の画面を開く */}
            <ul className="wallpaper-list">
              {WALLPAPER_IDS.map((id) => (
                <li key={id}>
                  <Link className="wallpaper-card" to={`/progress/wallpaper/${id}`} state={{ fromList: true }} aria-label={`壁紙 No.${id} を開く`}>
                    <span className="wallpaper-card-art">
                      <WallpaperImage src={getWallpaperPreviewUrl(id)} alt="" />
                    </span>
                    <span className="wallpaper-card-footer">
                      <strong className="wallpaper-card-title">No.{id}</strong>
                      <span className="wallpaper-card-open" aria-hidden="true">
                        開く
                        <Chevron direction="right" />
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <ProgressActionButton label="マップでモンスターを探す" to="/map" />
        )}
      </div>

      <BottomNavigation active="progress" />
    </main>
  );
}

export default ProgressWallpaper;

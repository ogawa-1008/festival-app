import { Link, useNavigate, useParams } from "react-router-dom";

import SwipeToConfirm from "../../components/SwipeToConfirm/SwipeToConfirm";
import { useGameTutorial } from "../../components/Tutorial/useGameTutorial";
import { useGame } from "../../context/GameContext";
import { useMapAreas } from "../../context/useMapAreas";
import { getFieldProgress, getRedeemConditionText } from "../../utils/fieldProgress";

import "./NoveltyRedeem.css";

// フィールドのステッカーをフォトスポットで交換する画面
function NoveltyRedeem() {
  const navigate = useNavigate();
  // 交換画面へは進捗のステッカーの画面から進むので、そこへ戻る
  const back = { to: "/progress/stickers", label: "ステッカーの画面へ戻る", replace: false };
  const { fieldId: fieldIdParam } = useParams();
  const { campusId, quests, obtainedFieldNoveltyIds, requiresUpdate, claimFieldNovelty } = useGame();
  const { active: practice } = useGameTutorial();

  const mapAreas = useMapAreas();
  const area = mapAreas.find((item) => String(item.id) === fieldIdParam);
  const progress = area ? getFieldProgress(area, quests, obtainedFieldNoveltyIds, mapAreas) : null;

  const canRedeem = Boolean(
    area && campusId && progress?.redeemable && !progress.noveltyObtained && !practice,
  );

  if (!area || !progress) {
    return (
      <main className="novelty-page">
        <section className="novelty-card">
          <h1>フィールドが見つかりません</h1>
          <button type="button" className="novelty-back" onClick={() => navigate(back.to, { replace: back.replace })}>
            {back.label}
          </button>
        </section>
      </main>
    );
  }

  // スワイプで確定したら、この端末に交換済みとして記録する
  // （ステッカーはアナログのスタンプラリーでも配るため、在庫はアプリでは数えない）
  const handleConfirm = () => canRedeem && claimFieldNovelty(area.id);

  return (
    <main className="novelty-page">
      <section className="novelty-card" aria-labelledby="novelty-title">
        <span className="novelty-eyebrow">FIELD {String(area.id).padStart(2, "0")} REWARD</span>
        <h1 id="novelty-title">{area.novelty.name}</h1>

        <div className="novelty-art" aria-hidden="true">
          {area.novelty.image ? <img src={area.novelty.image} alt="" /> : <span>🎁</span>}
        </div>

        <p className="novelty-description">{area.novelty.description}</p>

        {progress.rally.redeemed ? (
          <div className="novelty-done" role="status">
            <h2>交換済みです</h2>
            <p>ステッカーは1枚受け取り済みです。ほかの校舎でも追加の交換はできません。</p>
          </div>
        ) : practice ? (
          <p className="novelty-note">練習中はステッカーを交換できません。</p>
        ) : requiresUpdate ? (
          <p className="novelty-note">新しいバージョンに更新してから交換してください。</p>
        ) : !progress.redeemable ? (
          <p className="novelty-note">{getRedeemConditionText(progress)}</p>
        ) : !campusId ? (
          <p className="novelty-note">エリアを選んでから交換してください。</p>
        ) : (
          <>
            <p className="novelty-guide">
              フォトスポットのスタッフの前で、つまみを右端までスライドしてください。
            </p>

            <SwipeToConfirm
              label="右にスライドして交換"
              confirmedLabel="交換しました"
              onConfirm={handleConfirm}
            />
          </>
        )}

        <Link className="novelty-back" to={back.to} replace={back.replace}>
          {back.label}
        </Link>
      </section>
    </main>
  );
}

export default NoveltyRedeem;

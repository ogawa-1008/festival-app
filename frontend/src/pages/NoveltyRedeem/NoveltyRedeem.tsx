import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import SwipeToConfirm from "../../components/SwipeToConfirm/SwipeToConfirm";
import { useGameTutorial } from "../../components/Tutorial/useGameTutorial";
import { useGame } from "../../context/GameContext";
import { mapAreas } from "../../data/maps";
import {
  fetchNoveltyStocks,
  redeemNovelty,
  type NoveltyApiError,
} from "../../api/noveltyApi";
import { getFieldProgress } from "../../utils/fieldProgress";

import "./NoveltyRedeem.css";

const ERROR_MESSAGES: Record<NoveltyApiError, string> = {
  "out-of-stock": "このステッカーは在庫がなくなりました。近くのスタッフに声をかけてください。",
  "not-found": "この校舎ではこのステッカーを交換できません。近くのスタッフに声をかけてください。",
  network: "通信できませんでした。電波のよい場所で、もう一度お試しください。",
  server: "交換できませんでした。少し待ってから、もう一度お試しください。",
};

// 在庫の残り数（読み込み中は undefined、取得できなかったら null）
type Remaining = number | null | undefined;

// フィールドのステッカーをフォトスポットで交換する画面
function NoveltyRedeem() {
  const navigate = useNavigate();
  const { fieldId: fieldIdParam } = useParams();
  const { campusId, quests, obtainedFieldNoveltyIds, requiresUpdate, claimFieldNovelty } = useGame();
  const { active: practice } = useGameTutorial();

  const area = mapAreas.find((item) => String(item.id) === fieldIdParam);
  const progress = area ? getFieldProgress(area, quests, obtainedFieldNoveltyIds) : null;

  const [remaining, setRemaining] = useState<Remaining>(undefined);
  const [error, setError] = useState<NoveltyApiError | null>(null);
  // スワイプ後、API の結果を待っている間
  const [isRedeeming, setIsRedeeming] = useState(false);
  // スワイプ部品は1回確定すると戻らないため、失敗したら作り直す
  const [attempt, setAttempt] = useState(0);

  const canRedeem = Boolean(
    area && campusId && progress?.redeemable && !progress.noveltyObtained && !practice,
  );

  // 交換前に残り数を表示する（取得できなくても交換はできる）
  useEffect(() => {
    if (!area || !campusId || !canRedeem) return;

    let cancelled = false;

    void fetchNoveltyStocks(campusId).then((result) => {
      if (cancelled) return;

      setRemaining(
        result.ok
          ? result.value.find((stock) => stock.fieldId === area.id)?.remaining ?? null
          : null,
      );
    });

    return () => {
      cancelled = true;
    };
  }, [area, campusId, canRedeem]);

  if (!area || !progress) {
    return (
      <main className="novelty-page">
        <section className="novelty-card">
          <h1>フィールドが見つかりません</h1>
          <button type="button" className="novelty-back" onClick={() => navigate("/stamps")}>
            スタンプ・ステッカーへ戻る
          </button>
        </section>
      </main>
    );
  }

  // スワイプで確定したら API で在庫を減らし、成功したときだけ獲得済みとして記録する
  const handleConfirm = () => {
    if (!campusId || !canRedeem || isRedeeming) return false;

    setIsRedeeming(true);
    setError(null);

    void redeemNovelty(campusId, area.id).then((result) => {
      setIsRedeeming(false);

      if (result.ok) {
        setRemaining(result.value.remaining);
        claimFieldNovelty(area.id);
        return;
      }

      setError(result.error);
      if (result.error === "out-of-stock") setRemaining(0);
      setAttempt((value) => value + 1);
    });

    return true;
  };

  const outOfStock = remaining === 0 || error === "out-of-stock";

  return (
    <main className="novelty-page">
      <section className="novelty-card" aria-labelledby="novelty-title">
        <span className="novelty-eyebrow">FIELD {String(area.id).padStart(2, "0")} REWARD</span>
        <h1 id="novelty-title">{area.novelty.name}</h1>

        <div className="novelty-art" aria-hidden="true">
          {area.novelty.image ? <img src={area.novelty.image} alt="" /> : <span>🎁</span>}
        </div>

        <p className="novelty-description">{area.novelty.description}</p>
        <p className="novelty-location">交換場所：{area.novelty.redemptionLocation}</p>

        {progress.noveltyObtained ? (
          <div className="novelty-done" role="status">
            <h2>交換済みです</h2>
            <p>このフィールドのステッカーは受け取り済みです。</p>
          </div>
        ) : practice ? (
          <p className="novelty-note">練習中はステッカーを交換できません。</p>
        ) : requiresUpdate ? (
          <p className="novelty-note">新しいバージョンに更新してから交換してください。</p>
        ) : !progress.redeemable ? (
          <p className="novelty-note">
            {progress.available
              ? `このフィールドのモンスターをすべて討伐または調査すると交換できます（${progress.attempted} / ${progress.total}）`
              : "このフィールドのクエストは準備中です。"}
          </p>
        ) : !campusId ? (
          <p className="novelty-note">校舎を選んでから交換してください。</p>
        ) : (
          <>
            <p className="novelty-stock">
              {remaining === undefined
                ? "残り数を確認しています…"
                : remaining === null
                  ? "残り数を確認できませんでした"
                  : `残り ${remaining} 枚`}
            </p>

            <p className="novelty-guide">
              フォトスポットのスタッフの前で、つまみを右端までスライドしてください。
            </p>

            {(error || outOfStock) && (
              <p className="novelty-error" role="alert">
                {ERROR_MESSAGES[error ?? "out-of-stock"]}
              </p>
            )}

            {!outOfStock && (
              <SwipeToConfirm
                key={attempt}
                label={isRedeeming ? "交換しています…" : "右にスライドして交換"}
                confirmedLabel="交換しています…"
                disabled={isRedeeming}
                onConfirm={handleConfirm}
              />
            )}
          </>
        )}

        <Link className="novelty-back" to={`/stamps#field-${area.id}`}>
          スタンプ・ステッカーへ戻る
        </Link>
      </section>
    </main>
  );
}

export default NoveltyRedeem;

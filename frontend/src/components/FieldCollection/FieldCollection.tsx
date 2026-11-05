import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useGame } from "../../context/GameContext";
import { useMapAreas } from "../../context/useMapAreas";
import type { MapArea } from "../../types/maps";
import { getFieldProgress, getStampRallyProgress, getStampRallyState } from "../../utils/fieldProgress";
import "./FieldCollection.css";

type FieldProgress = ReturnType<typeof getFieldProgress>;

export function StickerIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M39 28V13a5 5 0 0 0-5-5H13a5 5 0 0 0-5 5v21a5 5 0 0 0 5 5h15Zm0 0H28v11M17 19l7-4 7 4-7 9Z" />
    </svg>
  );
}

export function FieldCollectionSummary({
  showLink = true,
  heading = "校舎を回ってスタンプを集めよう",
}: {
  showLink?: boolean;
  // ページ側に同じ見出しがあるときは別の見出しにして二重に出さない
  heading?: string;
}) {
  const { quests, obtainedFieldNoveltyIds } = useGame();
  const mapAreas = useMapAreas();
  const fields = mapAreas.map((area) => getFieldProgress(area, quests, obtainedFieldNoveltyIds, mapAreas));
  const total = fields.reduce((sum, field) => sum + field.total, 0);
  const earned = fields.reduce((sum, field) => sum + field.earned, 0);
  const rally = getStampRallyProgress(mapAreas, quests, obtainedFieldNoveltyIds);
  const state = getStampRallyState(rally);

  return (
    <section className="field-summary" aria-label={heading}>
      <div className="field-summary-heading">
        <div>
          <span className="field-eyebrow">FIELD COLLECTION</span>
          <h2>{heading}</h2>
        </div>
        <strong>
          {earned}
          <small> / {total}</small>
          <span>スタンプ</span>
        </strong>
      </div>
      <progress
        className="field-summary-progress"
        value={earned}
        max={Math.max(1, total)}
        aria-label={`スタンプ獲得 ${earned} / ${total}`}
      />
      <div className="field-summary-slots">
        {fields.map((field) => (
          <div
            key={field.area.id}
            className={
              field.complete ? "field-slot field-slot--earned" : "field-slot"
            }
          >
            <span aria-hidden="true">
              {field.complete ? "✓" : `0${field.area.id}`}
            </span>
            <small>{field.area.areaName}</small>
            <b>
              {field.available ? `${field.earned} / ${field.total}` : "準備中"}
            </b>
          </div>
        ))}
      </div>
      <div className={`field-summary-status field-summary-status--${state}`} role="status">
        <span className="field-summary-status-icon" aria-hidden="true">
          {state === "redeemed" ? "✓" : state === "redeemable" ? "!" : "◇"}
        </span>
        <span className="field-summary-status-text">
          <strong>
            {state === "redeemed"
              ? "ステッカー交換済み"
              : state === "redeemable"
                ? "スタンプ3つ達成！"
                : `あと ${rally.remaining} 校舎で交換できます`}
          </strong>
          <small>
            {state === "redeemed"
              ? "このステッカーは受け取り済みです。追加の交換はできません。"
              : state === "redeemable"
                ? "ステッカー1枚と交換できます。"
                : "1校舎につきスタンプ1つ。異なる校舎で討伐・調査を終えると増えます。"}
          </small>
        </span>
        {state === "redeemable" && (
          <Link className="field-summary-cta" to="/progress/stickers">
            交換する
          </Link>
        )}
      </div>
      {showLink && (
        <Link className="field-collection-link" to="/progress/fields">
          スタンプを見る <span aria-hidden="true">›</span>
        </Link>
      )}
    </section>
  );
}

export function FieldStatus({ progress }: { progress: FieldProgress }) {
  return (
    <span className="field-status">
      <span className={progress.complete ? "field-status-earned" : ""}>
        {progress.complete ? (
          <span aria-hidden="true">✓</span>
        ) : (
          <span aria-hidden="true">◇</span>
        )}{" "}
        {progress.complete
          ? "スタンプ獲得済み"
          : `スタンプ ${progress.available ? `${progress.earned}/${progress.total}` : "準備中"}`}
      </span>
    </span>
  );
}

export function FieldRewards({
  area,
  progress,
}: {
  area: MapArea;
  progress: FieldProgress;
}) {
  return (
    <div className="field-rewards">
      <section
        className="field-stamps"
        aria-label={`${area.areaName}のスタンプ`}
      >
        <div className="field-section-heading">
          <h3>獲得スタンプ</h3>
          <span>
            {progress.available
              ? `${progress.earned} / ${progress.total}`
              : "準備中"}
          </span>
        </div>
        {progress.quests.length > 0 ? (
          <div className="field-stamp-list">
            {progress.quests.map((quest) => {
              const earned = quest.completed || quest.investigated;

              return (
                <div
                  key={quest.id}
                  className={`field-stamp${earned ? " field-stamp--earned" : ""}`}
                >
                  <div className="field-stamp-seal" aria-hidden="true">
                    <img src={quest.image} alt="" />
                  </div>
                  <div className="field-stamp-copy">
                    <strong>{quest.title}</strong>
                    {!earned && (
                      <span className="field-state-label">未獲得</span>
                    )}
                    <p>
                      {earned
                        ? "この校舎のスタンプを獲得しました。再戦してもスタンプは増えません。"
                        : "この校舎のモンスターを討伐または調査し、報酬を受け取ると獲得できます。"}
                    </p>
                  </div>
                  {earned && (
                    <>
                      <img
                        className="field-stamp-mark"
                        src="/images/quests/quest-clear.webp"
                        alt=""
                        aria-hidden="true"
                      />
                      <span className="field-stamp-ribbon" aria-hidden="true">
                        {quest.goldCrown ? "♛ 金冠スタンプ" : "✓ 獲得済み"}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="field-pending">
            このフィールドのクエストは準備中です。
          </p>
        )}
      </section>
    </div>
  );
}

export default function FieldCollection() {
  const { quests, obtainedFieldNoveltyIds } = useGame();
  const mapAreas = useMapAreas();
  const { hash } = useLocation();
  useEffect(() => {
    if (/^#field-\d+$/.test(hash))
      document
        .getElementById(hash.slice(1))
        ?.scrollIntoView({ block: "start" });
  }, [hash]);

  return (
    <>
      <FieldCollectionSummary showLink={false} heading="スタンプの獲得状況" />
      <div className="field-collection-list">
        {mapAreas.map((area) => {
          const progress = getFieldProgress(area, quests, obtainedFieldNoveltyIds, mapAreas);

          return (
            <article
              key={area.id}
              id={`field-${area.id}`}
              className={`field-collection-card${progress.complete ? " field-collection-card--complete" : ""}`}
              aria-labelledby={`field-title-${area.id}`}
            >
              <header
                className="field-collection-cover"
                style={{
                  backgroundImage: area.image
                    ? `linear-gradient(0deg, var(--color-bg-deep), transparent), url("${area.image}")`
                    : "linear-gradient(0deg, var(--color-bg-deep), var(--color-bg-raised))",
                }}
              >
                <span className="field-cover-number">
                  FIELD {String(area.id).padStart(2, "0")}
                </span>
                <span className="field-cover-building">{area.buildingName}</span>
                <h2 id={`field-title-${area.id}`}>{area.areaName}</h2>
                {progress.complete && (
                  <span className="field-cover-complete">✓ スタンプ獲得</span>
                )}
              </header>
              <FieldRewards area={area} progress={progress} />
            </article>
          );
        })}
      </div>
    </>
  );
}

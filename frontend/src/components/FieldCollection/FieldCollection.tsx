import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useGame } from "../../context/GameContext";
import { useMapAreas } from "../../context/useMapAreas";
import type { MapArea } from "../../types/maps";
import { getFieldProgress } from "../../utils/fieldProgress";
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
      <p className="field-novelty-note">1校舎につきスタンプ1つ。異なる3校舎で討伐・調査を終えると、ステッカー1枚と交換できます。</p>
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
        <span aria-hidden="true">{progress.complete ? "✓" : "◇"}</span> スタンプ{" "}
        {progress.available ? `${progress.earned}/${progress.total}` : "準備中"}
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
            {progress.quests.map((quest) => (
              <div
                key={quest.id}
                className={`field-stamp ${quest.completed || quest.investigated ? "field-stamp--earned" : ""}`}
              >
                <div className="field-stamp-seal" aria-hidden="true">
                  <img src={quest.image} alt="" />
                  {(quest.completed || quest.investigated) && (
                    <img
                      className="field-stamp-clear"
                      src="/images/quests/quest-clear.webp"
                      alt=""
                    />
                  )}
                </div>
                <div className="field-stamp-copy">
                  <strong>{quest.title}</strong>
                  <span className="field-state-label">
                    {quest.completed || quest.investigated
                      ? quest.goldCrown
                        ? "♛ 金冠スタンプ獲得"
                        : quest.completed ? "✓ 討伐スタンプ獲得済み" : "✓ 調査スタンプ獲得済み"
                      : "未獲得"}
                  </span>
                  <p>
                    {quest.completed || quest.investigated
                      ? "この校舎のスタンプを獲得しました。再戦してもスタンプは増えません。"
                      : "この校舎のモンスターを討伐または調査し、報酬を受け取ると獲得できます。"}
                  </p>
                </div>
              </div>
            ))}
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
        {mapAreas.map((area) => (
          <article
            key={area.id}
            id={`field-${area.id}`}
            className="field-collection-card"
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
            </header>
            <FieldRewards
              area={area}
              progress={getFieldProgress(area, quests, obtainedFieldNoveltyIds, mapAreas)}
            />
          </article>
        ))}
      </div>
    </>
  );
}

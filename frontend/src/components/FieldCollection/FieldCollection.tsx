import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useGame } from "../../context/GameContext";
import { mapAreas } from "../../data/maps";
import type { MapArea } from "../../types/maps";
import { getFieldProgress } from "../../utils/fieldProgress";
import "./FieldCollection.css";

type FieldProgress = ReturnType<typeof getFieldProgress>;

function GiftIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M8 23h32v18H8zM5 16h38v7H5zM24 16v25M24 16C10 17 10 3 18 7c4 2 6 9 6 9Zm0 0C38 17 38 3 30 7c-4 2-6 9-6 9Z" />
    </svg>
  );
}

export function FieldCollectionSummary({
  showLink = true,
}: {
  showLink?: boolean;
}) {
  const { quests, obtainedFieldNoveltyIds } = useGame();
  const fields = mapAreas.map((area) => ({
    area,
    ...getFieldProgress(area, quests, obtainedFieldNoveltyIds),
  }));
  const total = fields.reduce((sum, field) => sum + field.total, 0);
  const earned = fields.reduce((sum, field) => sum + field.earned, 0);

  return (
    <section className="field-summary" aria-label="フィールドの収集状況">
      <div className="field-summary-heading">
        <div>
          <span className="field-eyebrow">FIELD COLLECTION</span>
          <h2>フィールドの収集状況</h2>
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
      {showLink && (
        <Link className="field-collection-link" to="/stamps">
          スタンプ・ノベルティを見る <span aria-hidden="true">›</span>
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
      <span className={progress.noveltyObtained ? "field-status-earned" : ""}>
        <span aria-hidden="true">{progress.noveltyObtained ? "✓" : "◇"}</span>{" "}
        ノベルティ {progress.noveltyObtained ? "獲得済み" : "未獲得"}
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
                className={`field-stamp ${quest.completed ? "field-stamp--earned" : ""}`}
              >
                <div className="field-stamp-seal" aria-hidden="true">
                  <img src={quest.image} alt="" />
                  {quest.completed && (
                    <img
                      className="field-stamp-clear"
                      src="/images/quests/stamp-image.png"
                      alt=""
                    />
                  )}
                </div>
                <div className="field-stamp-copy">
                  <strong>{quest.title}</strong>
                  <span className="field-state-label">
                    {quest.completed
                      ? quest.goldCrown
                        ? "♛ 金冠スタンプ獲得"
                        : "✓ スタンプ獲得済み"
                      : "未獲得"}
                  </span>
                  <p>
                    {quest.completed
                      ? "このフィールドの討伐を記録しました。"
                      : "モンスターを討伐して報酬を受け取ると獲得できます。"}
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
      <section
        className={`field-novelty ${progress.noveltyObtained ? "field-novelty--earned" : ""}`}
        aria-label={`${area.areaName}のノベルティ`}
      >
        <div className="field-section-heading">
          <h3>フィールドノベルティ</h3>
          <span className="field-state-label">
            {progress.noveltyObtained ? "✓ 獲得済み" : "未獲得"}
          </span>
        </div>
        <div className="field-novelty-content">
          <div className="field-novelty-art" aria-hidden="true">
            {area.novelty.image ? (
              <img src={area.novelty.image} alt="" />
            ) : (
              <GiftIcon />
            )}
          </div>
          <div>
            <span className="field-eyebrow">
              FIELD {String(area.id).padStart(2, "0")} REWARD
            </span>
            <h4>{area.novelty.name}</h4>
            <p>{area.novelty.description}</p>
          </div>
        </div>
        <p className="field-novelty-note">
          {progress.noveltyObtained
            ? "このフィールドのノベルティは獲得済みです。"
            : "受取方法・条件は会場でご確認ください。"}
        </p>
      </section>
    </div>
  );
}

export default function FieldCollection() {
  const { quests, obtainedFieldNoveltyIds } = useGame();
  const { hash } = useLocation();
  useEffect(() => {
    if (/^#field-\d+$/.test(hash))
      document
        .getElementById(hash.slice(1))
        ?.scrollIntoView({ block: "start" });
  }, [hash]);

  return (
    <>
      <FieldCollectionSummary showLink={false} />
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
                backgroundImage: `linear-gradient(0deg, var(--color-bg-deep), transparent), url("${area.image}")`,
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
              progress={getFieldProgress(area, quests, obtainedFieldNoveltyIds)}
            />
          </article>
        ))}
      </div>
    </>
  );
}

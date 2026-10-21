import { useState } from "react";
import { Link } from "react-router-dom";

import { mapAreas } from "../../data/maps";
import BottomNavigation from "../../components/Navigation/BottomNavigation";
import { useGame } from "../../context/GameContext";
import { useGameTutorial } from "../../components/Tutorial/useGameTutorial";
import {
  FieldCollectionSummary,
  FieldRewards,
  FieldStatus,
} from "../../components/FieldCollection/FieldCollection";
import { getFieldProgress } from "../../utils/fieldProgress";

import PageTitle from "../../components/PageTitle/PageTitle";
import "./Map.css";

function Map() {
  const { active, step, advance } = useGameTutorial();
  const [selectedAreaId, setSelectedAreaId] =
    useState<number | null>(active && step === "map-home" ? 1 : null);
  const { quests, obtainedFieldNoveltyIds } = useGame();

  return (
    <main className="map-page">
      <div className="map-background" />

      <div className="map-content">
        <PageTitle eyebrow="FIELD MAP" title="フィールドマップ" />

        <FieldCollectionSummary />

        <div className="map-list">
          {mapAreas.map((area) => {
            const isSelected =
              selectedAreaId === area.id;
            const fieldProgress = getFieldProgress(area, quests, obtainedFieldNoveltyIds);

            return (
              <div
                key={area.id}
                className="map-area-wrapper"
              >
                {/* マップカード */}
                <button
                  type="button"
                  aria-expanded={isSelected}
                  aria-controls={isSelected ? `map-field-detail-${area.id}` : undefined}
                  data-tutorial={area.id === 1 ? "map-field" : undefined}
                  className={`map-card ${
                    isSelected
                      ? "map-card-active"
                      : ""
                  }`}
                  onClick={() => {
                    if (active) advance("field-open");
                    setSelectedAreaId(
                      isSelected
                        ? null
                        : area.id
                    );
                  }}
                >
                  <img
                    src={area.image}
                    alt={area.areaName}
                    className="map-card-image"
                    onError={(event) => {
                      event.currentTarget.style.display =
                        "none";
                    }}
                  />

                  <div className="map-card-fallback">
                    <span>{area.areaName}</span>
                  </div>

                  <div className="map-card-overlay" />

                  <span className="map-building-name">
                    {area.buildingName}
                  </span>

                  <span className="map-area-name">
                    {area.areaName}
                  </span>
                </button>

                <div className="map-field-status">
                  <FieldStatus progress={fieldProgress} />
                </div>

                {/* 選択したカードの下に詳細を表示 */}
                {isSelected && (
                  <div className="map-area-detail" id={`map-field-detail-${area.id}`}>
                    <div className="map-area-detail-header">
                      <span>FIELD INFORMATION</span>

                      <h2>{area.areaName}</h2>
                    </div>

                    <div className="map-area-detail-content">
                      <div className="map-detail-row">
                        <span>LOCATION</span>

                        <strong>
                          {area.buildingName}
                        </strong>
                      </div>

                      <div className="map-detail-row">
                        <span>FIELD</span>

                        <strong>
                          {area.areaName}
                        </strong>
                      </div>

                      <div className="map-detail-row">
                        <span>RECOMMENDED RANK</span>

                        <strong>ハンターランク {Math.min(area.id, 3)}</strong>
                      </div>

                      <FieldRewards area={area} progress={fieldProgress} />
                      <Link className="field-collection-link" to={`/progress/fields#field-${area.id}`}>
                        コレクションで見る <span aria-hidden="true">›</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <BottomNavigation active="map" />
    </main>
  );
}

export default Map;

import { useState } from "react";

import { mapAreas } from "../../data/maps";
import BottomNavigation from "../../components/Navigation/BottomNavigation";

import "./Map.css";

function Map() {
  const [selectedAreaId, setSelectedAreaId] =
    useState<number | null>(null);

  return (
    <main className="map-page">
      <div className="map-background" />

      <div className="map-content">
        <header className="map-header">
          <span className="map-header-subtitle">
            FIELD MAP
          </span>

          <h1>フィールドマップ</h1>
        </header>

        <div className="map-list">
          {mapAreas.map((area) => {
            const isSelected =
              selectedAreaId === area.id;

            return (
              <div
                key={area.id}
                className="map-area-wrapper"
              >
                {/* マップカード */}
                <button
                  type="button"
                  className={`map-card ${
                    isSelected
                      ? "map-card-active"
                      : ""
                  }`}
                  onClick={() => {
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

                {/* 選択したカードの下に詳細を表示 */}
                {isSelected && (
                  <div className="map-area-detail">
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

                      <p>
                        このエリアを探索して
                        クエストに挑戦しよう！
                      </p>
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
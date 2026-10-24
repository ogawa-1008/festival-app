import { useState } from "react";
import { useNavigate } from "react-router-dom";

import BottomNavigation from "../../components/Navigation/BottomNavigation";
import { useGame } from "../../context/GameContext";
import { getOwnedMaterial } from "../../utils/weaponMaterials";
import { getMaterial, MATERIAL_IDS } from "../../data/materials";

import "./Collection.css";

type CollectionView = "materials" | "history";

type CollectionProps = {
  view: CollectionView;
};

function Collection({ view }: CollectionProps) {
  const navigate = useNavigate();
  const { materials, activities } = useGame();
  const [historyFilter, setHistoryFilter] = useState<"all" | "hunt" | "exchange">("all");

  const title = {
    materials: "獲得した素材",
    history: "アクティビティ履歴",
  }[view];

  const visibleActivities = activities.filter((activity) =>
    historyFilter === "all"
      ? true
      : historyFilter === "hunt"
        ? activity.type === "hunt" || activity.type === "investigation"
        : activity.type === "exchange" || activity.type === "craft"
  );

  return (
    <main className="collection-page">
      <div className="collection-content">
        <header className="collection-header">
          <button
            type="button"
            className="collection-back"
            onClick={() => navigate(-1)}
            aria-label="前の画面へ戻る"
          >
            ←
          </button>
          <div>
            <span>HUNTER'S RECORD</span>
            <h1>{title}</h1>
          </div>
        </header>

        {view === "materials" && (
          <section className="collection-list" aria-label="素材一覧">
            {/* 武器に使う素材だけでなく、素材の一覧にあるものをすべて並べる */}
            {MATERIAL_IDS.map((id) => getMaterial(id)!).map((material) => (
              <article key={material.id} className="collection-row">
                <img src={material.image} alt={material.name} />
                <div>
                  <h2>{material.name}</h2>
                  <p>所持数</p>
                </div>
                <strong>× {getOwnedMaterial(materials, material.id)}</strong>
              </article>
            ))}
          </section>
        )}


        {view === "history" && (
          <section>
            <div className="history-filters" aria-label="履歴を絞り込む">
              <button type="button" className={historyFilter === "all" ? "selected" : ""} onClick={() => setHistoryFilter("all")}>すべて</button>
              <button type="button" className={historyFilter === "hunt" ? "selected" : ""} onClick={() => setHistoryFilter("hunt")}>討伐・調査</button>
              <button type="button" className={historyFilter === "exchange" ? "selected" : ""} onClick={() => setHistoryFilter("exchange")}>交換・作成</button>
            </div>
            <div className="collection-list">
              {visibleActivities.length === 0 ? (
                <p className="collection-empty">まだ履歴はありません。クエストに挑戦しよう！</p>
              ) : (
                visibleActivities.map((activity) => (
                  <article key={activity.id} className="history-row">
                    <span>{activity.type === "exchange" ? "◆" : activity.type === "craft" ? "⚒" : "⚔"}</span>
                    <div>
                      <h2>{activity.title}</h2>
                      <p>{activity.detail}</p>
                      <time dateTime={activity.createdAt}>
                        {new Date(activity.createdAt).toLocaleString("ja-JP")}
                      </time>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        )}
      </div>
      <BottomNavigation active="home" />
    </main>
  );
}

export default Collection;

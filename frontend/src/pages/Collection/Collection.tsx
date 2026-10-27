import { useState } from "react";
import { useNavigate } from "react-router-dom";

import BottomNavigation from "../../components/Navigation/BottomNavigation";
import { useGame } from "../../context/GameContext";

import "./Collection.css";

type CollectionView = "history";

type CollectionProps = {
  view: CollectionView;
};

function Collection({ view }: CollectionProps) {
  const navigate = useNavigate();
  const { activities } = useGame();
  const [historyFilter, setHistoryFilter] = useState<"all" | "hunt" | "exchange">("all");

  const title = {
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

        {view === "history" && (
          <section>
            <div className="history-filters" aria-label="履歴を絞り込む">
              <button type="button" className={historyFilter === "all" ? "selected" : ""} onClick={() => setHistoryFilter("all")}>すべて</button>
              <button type="button" className={historyFilter === "hunt" ? "selected" : ""} onClick={() => setHistoryFilter("hunt")}>討伐・調査</button>
              <button type="button" className={historyFilter === "exchange" ? "selected" : ""} onClick={() => setHistoryFilter("exchange")}>交換・強化</button>
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

import { useLayoutEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import PatternBackground from "../../components/Festival/PatternBackground";
import { useGame } from "../../context/GameContext";
import { findCampus } from "../../data/campuses";
import { getMapAreas } from "../../data/maps";
import "./BuildingSelection.css";

const asset = "/images/campus/";

function BuildingSelection() {
  const { campusId, buildingId, quests, selectBuilding } = useGame();
  const navigate = useNavigate();
  const campus = findCampus(campusId);
  const areas = getMapAreas(campusId);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // エリアを選ぶ前に開かれた場合は、エリア選択へ戻す
  if (!campusId || !campus) return <Navigate to="/start" replace />;

  return (
    <main className="building-selection festival-ui">
      <PatternBackground />

      <div className="building-content">
        <div className="building-topbar">
          <button
            type="button"
            className="building-topback"
            onClick={() => navigate(buildingId !== null ? "/" : "/start")}
          >
            ← 戻る
          </button>
        </div>

        <header className="building-heading">
          <p className="building-eyebrow">― {campus.name} ー</p>
          <h1>校舎を選択</h1>
          <p className="building-lead">参加する校舎を選んでください</p>
        </header>

        <div className="building-list" aria-label={`${campus.name}の校舎`}>
          {areas.map((area) => {
            const quest = quests.find((item) => area.questIds.includes(item.id));
            const status = quest?.completed ? "討伐済み" : quest?.investigated ? "調査済み" : null;
            const current = buildingId === area.id;

            return (
              <button
                key={area.id}
                type="button"
                className={`building-card${current ? " building-card--current" : ""}`}
                aria-current={current ? "true" : undefined}
                onClick={() => {
                  selectBuilding(area.id);
                  navigate("/", { replace: true });
                }}
              >
                <span className="building-card-ornament" aria-hidden="true" />
                <span className="building-seal" aria-hidden="true">
                  <img src={`${asset}campus-seal.svg`} alt="" />
                </span>
                <span className="building-card-labels">
                  <span className="building-card-number">NO.{area.id}</span>
                  <span className="building-card-name">{area.buildingName}</span>
                  <span className="building-card-meta">
                    {area.areaName} ／ {area.photoSpotMonster}
                  </span>
                </span>
                <span className="building-card-side">
                  {current && <span className="building-card-current">選択中</span>}
                  {status && <span className="building-card-status">{status}</span>}
                  <img className="building-chevron" src={`${asset}chevron.svg`} alt="" />
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="building-area-change"
          onClick={() => navigate("/start")}
        >
          ← エリアを選び直す
        </button>
      </div>
    </main>
  );
}

export default BuildingSelection;

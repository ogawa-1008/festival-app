import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PatternBackground from "../../components/Festival/PatternBackground";
import { useBattleSession } from "../../context/BattleSessionContext";
import { useGame } from "../../context/GameContext";
import { useGameTutorial } from "../../components/Tutorial/useGameTutorial";
import { campuses } from "../../data/campuses";
import "./CampusSelection.css";

type Campus = (typeof campuses)[number];
const asset = "/images/campus/";

function CampusSelection() {
  const { campusId, selectCampus } = useGame();
  const { session } = useBattleSession();
  const navigate = useNavigate();
  const { active: practice } = useGameTutorial();
  // ホームのメニューから開いたときは、ホームの履歴の位置（returnIdx）が渡される。
  // 決めたときに、今の画面がそのすぐ次なら1つ戻る（履歴にホームが2つ並ばないように）
  const returnIdx = (useLocation().state as { returnIdx?: number } | null)?.returnIdx;
  const [pendingCampus, setPendingCampus] = useState<Campus | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  // バトル中・報酬を受け取る前は、別の校舎に変えると報酬を受け取れなくなるので変えさせない
  const isBattleUnfinished = session !== null && !session.claimed;
  // 別のエリアに変えようとしているか
  const changingCampus = pendingCampus !== null && pendingCampus.id !== campusId;
  // 練習中にエリアを変えると、練習用のクエストが消えて先に進めなくなるので変えさせない
  const blockedByPractice = practice && changingCampus;
  const blocked = changingCampus && (practice || isBattleUnfinished);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (pendingCampus && dialog && !dialog.open) {
      dialog.showModal();
    }
  }, [pendingCampus]);

  return (
    <main className="campus-selection festival-ui">
      <PatternBackground />

      <div className="campus-content">
        <header className="campus-heading">
          <p className="campus-eyebrow">― 文化祭 × モンハンコラボ ―</p>
          <h1>エリアを選択</h1>
        </header>

        <div className="campus-list" aria-label="参加するエリア">
          {campuses.map((campus) => (
            <button
              key={campus.id}
              type="button"
              className="campus-card campus-paper"
              aria-label={`${campus.name}を選択`}
              aria-haspopup="dialog"
              onClick={() => setPendingCampus(campus)}
            >
              <span className="campus-card-ornament" aria-hidden="true" />
              <span className="campus-seal" aria-hidden="true">
                <img src={`${asset}campus-seal.svg`} alt="" />
              </span>
              <span className="campus-card-labels">
                <span className="campus-english">{campus.englishName}</span>
                <span className="campus-name">{campus.name}</span>
                <span className="campus-card-hint">このエリアでクエストに参加</span>
              </span>
              <img className="campus-chevron" src={`${asset}chevron.svg`} alt="" />
            </button>
          ))}
        </div>
      </div>

      <dialog
        ref={dialogRef}
        className="campus-dialog campus-paper festival-ui"
        aria-labelledby="campus-confirm-title"
        aria-describedby="campus-confirm-name campus-confirm-description"
        onClose={() => setPendingCampus(null)}
      >
        <span className="campus-dialog-ornament" aria-hidden="true" />
        <p className="campus-eyebrow">― 出発前の確認 ―</p>
        <h2 id="campus-confirm-title">このエリアで始めますか？</h2>
        <div className="campus-chosen">
          <p id="campus-confirm-name">{pendingCampus?.name}</p>
          <p className="campus-english">{pendingCampus?.englishName}</p>
        </div>
        <p id="campus-confirm-description" className="campus-confirm-description">
          {blockedByPractice
            ? <>操作の練習中は<br />エリアを変えられません。</>
            : blocked
            ? <>バトル中、または報酬を受け取る前は<br />エリアを変えられません。</>
            : <>選択したエリアのクエストと<br />マップを表示します。</>}
        </p>
        <div className="campus-dialog-actions">
          <button type="button" className="campus-cancel" autoFocus onClick={() => dialogRef.current?.close()}>
            選び直す
          </button>
          <button
            type="button"
            className="festival-button"
            disabled={blocked}
            onClick={() => {
              if (!pendingCampus || blocked) return;
              // 同じエリアを選んだときは選び直さない（練習中も、進み具合を読み直さずにそのまま戻る）
              if (!changingCampus || selectCampus(pendingCampus.id)) {
                // ホームのメニューから開いて、すぐ前がそのホームなら戻る。それ以外（最初の選択など）はホームへ進む
                const currentIdx = (window.history.state as { idx?: number } | null)?.idx;
                if (returnIdx !== undefined && currentIdx === returnIdx + 1) navigate(-1);
                else navigate("/", { replace: true });
              }
            }}
          >
            このエリアに決定
          </button>
        </div>
      </dialog>
    </main>
  );
}

export default CampusSelection;

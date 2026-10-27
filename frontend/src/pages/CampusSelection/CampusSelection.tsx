import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PatternBackground from "../../components/Festival/PatternBackground";
import { useBattleSession } from "../../context/BattleSessionContext";
import { useGame } from "../../context/GameContext";
import { useGameTutorial } from "../../components/Tutorial/useGameTutorial";
import { campuses } from "../../data/campuses";
import { getHistoryIndex } from "../../utils/historyIndex";
import { hasChosenSound, setSoundEnabled, startBgm } from "../../utils/sound";
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
  // エリアを決めたあと、まだ選んでいなければ、音を鳴らすかを聞く
  const [askingSound, setAskingSound] = useState(false);
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

  // ホームのメニューから開いて、すぐ前がそのホームなら戻る。それ以外（最初の選択など）はホームへ進む
  // （履歴の位置が読めないときも、ホームへ進むだけで困らない）
  const leavingRef = useRef(false);
  const leave = () => {
    // 続けて2回押しても、2つ前の画面まで戻らないようにする
    if (leavingRef.current) return;
    leavingRef.current = true;
    const currentIdx = getHistoryIndex();
    if (returnIdx !== undefined && currentIdx !== undefined && currentIdx === returnIdx + 1) navigate(-1);
    else navigate("/", { replace: true });
  };

  // 鳴らすかを選んだらホームへ（オンにすると、タップしたその場でBGMが流れ始める）
  const chooseSound = (on: boolean) => {
    setSoundEnabled(on);
    leave();
  };

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
          <p className="campus-eyebrow">― バンタン文化祭 × モンハンコラボ ―</p>
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
        className={`campus-dialog campus-paper festival-ui${askingSound ? " campus-dialog--sound" : ""}`}
        aria-labelledby="campus-confirm-title"
        aria-describedby={askingSound ? "campus-confirm-description" : "campus-confirm-name campus-confirm-description"}
        // 音を聞いている途中で閉じたら（Esc など）、選ばずにホームへ進む（音はオフのまま。次にエリアを選ぶときにまた聞く）
        onClose={() => {
          setPendingCampus(null);
          if (askingSound) leave();
        }}
      >
        <span className="campus-dialog-ornament" aria-hidden="true" />
        {askingSound ? (
          <>
            <p className="campus-eyebrow">― サウンドの設定 ―</p>
            <h2 id="campus-confirm-title">音を鳴らしますか？</h2>
            <p id="campus-confirm-description" className="campus-confirm-description">
              BGMと効果音が流れます。<br />あとからメニューで切り替えられます。
            </p>
            <div className="campus-dialog-actions">
              <button type="button" className="campus-cancel" autoFocus onClick={() => chooseSound(false)}>
                鳴らさない
              </button>
              <button type="button" className="festival-button" onClick={() => chooseSound(true)}>
                鳴らす
              </button>
            </div>
          </>
        ) : (
          <>
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
                    // スマホは、タップした瞬間でないとBGMを流し始められないため、決めたときに流し始める
                    // （オフなら、オンにしたときに流れる。まだ選んでいなければ、このあと聞く）
                    startBgm();
                    if (hasChosenSound()) leave();
                    else setAskingSound(true);
                  }
                }}
              >
                このエリアに決定
              </button>
            </div>
          </>
        )}
      </dialog>
    </main>
  );
}

export default CampusSelection;

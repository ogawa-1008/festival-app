import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PatternBackground from "../../components/Festival/PatternBackground";
import { canBeginBattle, useBattleSession } from "../../context/BattleSessionContext";
import { isUntouchedSession } from "../../utils/battleSession";
import { useGame } from "../../context/GameContext";
import { getBattleMonsterImage, prepareBattle } from "../Battle/battleAssets";
import { useGameTutorial } from "../../components/Tutorial/useGameTutorial";
import { playSe } from "../../utils/sound";
import "./QuestLoading.css";

type Phase = "preparing" | "ready" | "error";
const artwork = "/images/loading/";

export default function QuestLoading() {
  const { questId } = useParams();
  const { quests } = useGame();
  const navigate = useNavigate();
  const { active: practice, advance } = useGameTutorial();
  const { session, beginBattle, cancelBattle } = useBattleSession();
  // QRを読み取ってできたバトル（このタブのもの・まだ受け取っていないもの）がないと始められない
  // （URLを直接開いただけでは遊べないように）
  const hasScanned = canBeginBattle(session, questId);
  const quest = quests.find((item) => item.id === questId);
  const monsterImage = quest ? getBattleMonsterImage(quest) : undefined;
  const [preparation, setPreparation] = useState<{ questId: string | undefined; phase: Phase }>({ questId, phase: "preparing" });
  const phase = preparation.questId === questId ? preparation.phase : "preparing";
  const [attempt, setAttempt] = useState(0);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [questId]);

  useEffect(() => {
    // 始められないときは、使わない画像を読み込まない
    if (!questId || !quest || !hasScanned) return;

    const controller = new AbortController();
    let disposed = false;
    const timeout = setTimeout(() => controller.abort(new Error("Preparation timed out")), 15000);

    void prepareBattle(controller.signal, monsterImage, quest.fieldImage).then(() => {
      clearTimeout(timeout);
      if (disposed) return;
      // 準備ができたら確認画面にする（バトルへは「狩猟を始める」を押したときに進む）
      setPreparation({ questId, phase: "ready" });
    }).catch(() => {
      clearTimeout(timeout);
      controller.abort();
      if (!disposed) setPreparation({ questId, phase: "error" });
    });

    return () => {
      disposed = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [questId, quest, monsterImage, attempt, hasScanned]);

  // 途中まで進めたバトルをQRの読み直しで開いた場合は「続きから」
  const isResume = hasScanned && !isUntouchedSession(session);

  const ready = phase === "ready" && hasScanned;
  const error = !quest || !hasScanned || phase === "error";
  const status = !quest
    ? "クエストが見つかりません"
    : !hasScanned
      ? "QRコードを読み取ってから挑戦してください"
      : phase === "error"
        ? "狩猟フィールドを読み込めませんでした"
        : ready ? "準備が整いました" : "狩猟フィールドを準備しています…";

  // 「狩猟を始める」：開始の時刻を押した時刻に合わせてからバトルへ
  const handleStart = () => {
    if (!questId || !ready) return;
    if (!beginBattle(questId)) {
      navigate("/", { replace: true });
      return;
    }
    playSe("questStart");
    if (practice) advance("battle-ready");
    navigate(`/battle/${questId}`, { replace: true });
  };

  // 「戻る」：まだ1手も出していなければバトルを取り消してホームへ
  // （練習中は取り消さない。ガイドを再開したときに、この確認画面から続けられるように）
  const handleCancel = () => {
    if (questId && !practice) cancelBattle(questId);
    navigate("/", { replace: true });
  };

  return (
    <main className={`quest-loading festival-ui${ready ? " quest-loading--ready" : ""}${error ? " quest-loading--error" : ""}`} aria-labelledby="departure-title">
      <PatternBackground loading />
      <div className="departure-rim" aria-hidden="true" />
      <div className="departure-ornament" aria-hidden="true" />

      <div className="departure-content">
        <header className="departure-heading">
          <p>{ready ? "QUEST CONFIRM" : "QUEST DEPARTURE"}</p>
          <h1 id="departure-title">{error ? "出発できませんでした" : ready ? "出発の確認" : "狩猟の準備中"}</h1>
          <p>
            {!quest || !hasScanned
              ? "QRコードを読み取り直してください"
              : error
                ? "通信状況を確認して、もう一度お試しください"
                : ready
                  ? isResume ? "このクエストの続きに挑戦しますか？" : "このクエストに挑戦しますか？"
                  : "まもなく準備が整います"}
          </p>
        </header>

        <div className="departure-emblem" aria-hidden="true">
          <img className="departure-glow" src={`${artwork}${ready ? "glow-ready.svg" : "glow.svg"}`} alt="" />
          <img className="departure-ring-outer" src={`${artwork}ring-outer.svg`} alt="" />
          <img className="departure-ring-inner" src={`${artwork}ring-inner.svg`} alt="" />
          {ready ? <img className="departure-ring-complete" src={`${artwork}ring-complete.svg`} alt="" /> : (
            <div className="departure-ring-spin">
              <img src={`${artwork}ring-active.svg`} alt="" />
            </div>
          )}
          <div className="departure-compass">
            <img src={`${artwork}compass.svg`} alt="" />
            <img className="departure-compass-ticks" src={`${artwork}compass-ticks.svg`} alt="" />
          </div>
          <img className="departure-monster" src={monsterImage} alt="" />
        </div>

        <section className="departure-quest" aria-label="読み取ったクエスト">
          <p>討伐クエスト</p>
          <h2>{quest?.title ?? "クエストを読み取り直してください"}</h2>
        </section>

        <div className="departure-status">
          {quest && <ol className="departure-steps" aria-label="出発までの進行状況">
            <li className={hasScanned ? "is-complete" : "is-current"} aria-current={!hasScanned ? "step" : undefined}>読取完了</li>
            <li className={ready ? "is-complete" : hasScanned ? "is-current" : ""} aria-current={hasScanned && !ready ? "step" : undefined}>狩猟準備</li>
            <li className={ready ? "is-complete" : ""} aria-current={ready ? "step" : undefined}>出発</li>
          </ol>}
          <p role="status" aria-live="polite">{status}</p>
          {!ready && !error && <progress className="departure-progress" aria-label="狩猟フィールドを読み込み中" />}
        </div>

        {/* 練習のガイドが光らせる場所（data-tutorial）。エラーのときも、押せるボタンがガイドの対象に入るようにする */}
        {error ? (
          <div className="departure-error-actions" data-tutorial="quest-confirm">
            {quest && hasScanned && <button type="button" className="festival-button" onClick={() => {
              setPreparation({ questId, phase: "preparing" });
              setAttempt((value) => value + 1);
            }}>もう一度試す</button>}
            <button type="button" className="festival-button" onClick={() => navigate("/qr-scanner", { replace: true })}>QRコードを読み直す</button>
          </div>
        ) : (
          <>
            {/* 「狩猟を始める」は準備が整うまで押せない。押したときにバトルの開始時刻を決める */}
            <div className="departure-actions" data-tutorial="quest-confirm">
              <button
                type="button"
                className="festival-button"
                disabled={!ready}
                onClick={handleStart}
              >
                {!ready ? "準備中…" : isResume ? "続きから狩猟する" : "狩猟を始める"}
              </button>
              <button type="button" className="departure-cancel" onClick={handleCancel}>
                戻る
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

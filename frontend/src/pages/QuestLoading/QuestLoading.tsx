import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PatternBackground from "../../components/Festival/PatternBackground";
import { useGame } from "../../context/GameContext";
import { battleAssets, prepareBattle } from "../Battle/battleAssets";
import { useGameTutorial } from "../../components/Tutorial/useGameTutorial";
import "./QuestLoading.css";

type Phase = "preparing" | "ready" | "error";
const artwork = "/images/loading/";

export default function QuestLoading() {
  const { questId } = useParams();
  const { quests } = useGame();
  const navigate = useNavigate();
  const { active: practice, advance } = useGameTutorial();
  const quest = quests.find((item) => item.id === questId);
  const [preparation, setPreparation] = useState<{ questId: string | undefined; phase: Phase }>({ questId, phase: "preparing" });
  const phase = preparation.questId === questId ? preparation.phase : "preparing";
  const [attempt, setAttempt] = useState(0);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [questId]);

  useEffect(() => {
    if (!questId || !quest) return;

    const controller = new AbortController();
    let disposed = false;
    let departure: ReturnType<typeof setTimeout> | undefined;
    const timeout = setTimeout(() => controller.abort(new Error("Preparation timed out")), 15000);
    const startedAt = performance.now();

    void prepareBattle(controller.signal).then(() => {
      clearTimeout(timeout);
      if (disposed) return;
      setPreparation({ questId, phase: "ready" });
      // Figma's ready reveal, after the real preparation has completed.
      const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650;
      departure = setTimeout(() => {
        if (practice) advance("battle-ready");
        navigate(`/battle/${questId}`, { replace: true });
      }, practice ? Math.max(delay, 2200 - (performance.now() - startedAt)) : delay);
    }).catch(() => {
      clearTimeout(timeout);
      controller.abort();
      if (!disposed) setPreparation({ questId, phase: "error" });
    });

    return () => {
      disposed = true;
      clearTimeout(timeout);
      clearTimeout(departure);
      controller.abort();
    };
  }, [questId, quest, attempt, navigate, practice, advance]);

  const ready = phase === "ready";
  const error = !quest || phase === "error";
  const status = !quest
    ? "クエストが見つかりません"
    : phase === "error"
      ? "狩猟フィールドを読み込めませんでした"
      : ready ? "準備が整いました" : "狩猟フィールドを準備しています…";

  return (
    <main className={`quest-loading festival-ui${ready ? " quest-loading--ready" : ""}${error ? " quest-loading--error" : ""}`} aria-labelledby="departure-title">
      <PatternBackground loading />
      <div className="departure-rim" aria-hidden="true" />
      <div className="departure-ornament" aria-hidden="true" />

      <div className="departure-content">
        <header className="departure-heading">
          <p>{ready ? "QUEST START" : "QUEST DEPARTURE"}</p>
          <h1 id="departure-title">{error ? "出発できませんでした" : ready ? "狩猟開始" : "狩猟の準備中"}</h1>
          <p>{!quest ? "QRコードを読み取り直してください" : error ? "通信状況を確認して、もう一度お試しください" : ready ? "さあ、モンスターに挑もう" : "まもなく狩猟が始まります"}</p>
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
          <img className="departure-monster" src={battleAssets.monster} alt="" />
        </div>

        <section className="departure-quest" aria-label="読み取ったクエスト">
          <p>討伐クエスト</p>
          <h2>{quest?.title ?? "クエストを読み取り直してください"}</h2>
        </section>

        <div className="departure-status">
          {quest && <ol className="departure-steps" aria-label="出発までの進行状況">
            <li className="is-complete">読取完了</li>
            <li className={ready ? "is-complete" : "is-current"} aria-current={!ready ? "step" : undefined}>狩猟準備</li>
            <li className={ready ? "is-complete" : ""} aria-current={ready ? "step" : undefined}>出発</li>
          </ol>}
          <p role="status" aria-live="polite">{status}</p>
          {!ready && !error && <progress className="departure-progress" aria-label="狩猟フィールドを読み込み中" />}
        </div>

        {error ? (
          <div className="departure-error-actions">
            {quest && <button type="button" className="festival-button" onClick={() => {
              setPreparation({ questId, phase: "preparing" });
              setAttempt((value) => value + 1);
            }}>もう一度試す</button>}
            <button type="button" className="festival-button" onClick={() => navigate("/qr-scanner", { replace: true })}>QRコードを読み直す</button>
          </div>
        ) : (
          <aside className="departure-tip">
            <p>― 狩猟の心得 ―</p>
            <p>グー・チョキ・パーを選んで、<br />モンスターに挑もう。</p>
          </aside>
        )}
      </div>
    </main>
  );
}

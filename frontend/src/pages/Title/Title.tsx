import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { useGame } from "../../context/GameContext";
import "./Title.css";

// 火の粉の位置・速さ（毎回同じ並びにして、表示のたびに散らばり方が変わらないようにする）
const EMBERS = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  delay: (i * 0.73) % 6,
  duration: 6 + ((i * 1.7) % 5),
  size: 2 + (i % 4),
  drift: ((i % 5) - 2) * 14,
}));

// 演出が終わるまでの時間（これより前にタップしたら、演出を飛ばして最後の状態にする）
const INTRO_MS = 2600;
// タップしてから、エリア選択へ進むまでの時間（光が広がる演出の分）
const LEAVE_MS = 900;

// アプリを初めて開いたときのタイトル画面（エリアをまだ選んでいない人だけに出す）
function Title() {
  const { campusId } = useGame();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"intro" | "ready" | "leaving">("intro");
  const leaveTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const timer = window.setTimeout(() => setPhase((p) => (p === "intro" ? "ready" : p)), INTRO_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);

  // すでにエリアを選んでいる人はホームへ
  if (campusId) return <Navigate to="/" replace />;

  const handleTap = () => {
    if (phase === "intro") {
      setPhase("ready");
      return;
    }
    if (phase === "leaving") return;
    setPhase("leaving");
    leaveTimer.current = window.setTimeout(() => navigate("/start", { replace: true }), LEAVE_MS);
  };

  return (
    <main className={`title-screen title-screen--${phase}`}>
      <div className="title-bg" aria-hidden="true" />
      <div className="title-rays" aria-hidden="true" />
      <div className="title-monster" aria-hidden="true">
        <img src="/images/monsters/renders/rathalos.webp" alt="" />
      </div>
      <div className="title-shade" aria-hidden="true" />

      <div className="title-embers" aria-hidden="true">
        {EMBERS.map((e, i) => (
          <span
            key={i}
            style={{
              "--left": `${e.left}%`,
              "--delay": `${e.delay}s`,
              "--duration": `${e.duration}s`,
              "--size": `${e.size}px`,
              "--drift": `${e.drift}px`,
            } as CSSProperties}
          />
        ))}
      </div>

      <div className="title-frame" aria-hidden="true">
        <span className="title-corner title-corner--tl" />
        <span className="title-corner title-corner--tr" />
        <span className="title-corner title-corner--bl" />
        <span className="title-corner title-corner--br" />
      </div>

      <div className="title-center">
        <p className="title-kicker">2026 VANTAN FESTIVAL</p>
        <div className="title-logo">
          <img src="/images/logo/collaboration-logo.webp" alt="MONSTER HUNTER × VANTAN" />
          <span className="title-logo-shine" aria-hidden="true" />
        </div>
        <h1 className="title-catch">
          <span className="title-catch-line" aria-hidden="true" />
          狩猟解禁
          <span className="title-catch-line" aria-hidden="true" />
        </h1>
        <p className="title-sub">文化祭の会場を舞台に、モンスターを狩れ</p>
      </div>

      <button type="button" className="title-start" onClick={handleTap}>
        <span className="title-start-label">TAP TO START</span>
        <span className="title-start-ja">タップしてはじめる</span>
      </button>

      <div className="title-flash" aria-hidden="true" />
    </main>
  );
}

export default Title;

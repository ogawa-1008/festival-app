import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Driver } from "driver.js";
import { BattleSessionProvider } from "../../context/BattleSessionContext";
import { GameProvider, useGame } from "../../context/GameContext";
import { GameTutorialContext } from "./useGameTutorial";
import { useQrNotice } from "../../context/qrNotice";
import { clearPractice, createTutorialSteps, hasSeenTutorial, readActiveTutorialStep, saveActiveTutorialStep, saveTutorialStatus, type TutorialStep } from "./tutorialSteps";
import { PRACTICE_QUEST_ID } from "../../data/quests";
import "driver.js/dist/driver.css";
import "../Festival/FestivalDesign.css";
import "./GameTutorial.css";

function TutorialOverlay({ stepId, steps, advance, finish, minimize }: {
  stepId: string; steps: TutorialStep[]; advance: (action: string) => void; finish: (completed?: boolean) => void; minimize: () => void;
}) {
  const { pathname } = useLocation();
  const [tour, setTour] = useState<Driver>();

  useEffect(() => {
    let disposed = false;
    let instance: Driver | undefined;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    void import("driver.js").then(({ driver }) => {
      if (disposed) return;
      instance = driver({
        steps, animate: !motion.matches, duration: 380, smoothScroll: !motion.matches,
        overlayColor: "#080606", overlayOpacity: .68, overlayClickBehavior: "none",
        disableActiveInteraction: false, stagePadding: 8, stageRadius: 6,
        popoverClass: "festival-tour festival-ui", popoverOffset: 16,
        showProgress: true, progressText: "操作の練習 {{current}} / {{total}}", showButtons: ["close"],
        closeBtnLabel: "遊び方ガイドを最小化する",
        onNextClick: (_element, _step, { index }) => {
          if (index === 0) advance("begin");
          else if (index === steps.length - 1) finish(true);
        },
        onPrevClick: () => {},
        // ×は終了ではなく最小化。あとから続きを再開できるようにする
        onCloseClick: () => minimize(),
        onDestroyed: (_element, _step, { reason }) => {
          if (!disposed && reason !== "api") finish();
        },
        onPopoverRender: (popover) => {
          popover.wrapper.setAttribute("role", "dialog");
          popover.wrapper.setAttribute("aria-labelledby", popover.title.id);
          popover.wrapper.setAttribute("aria-describedby", popover.description.id);
          popover.wrapper.tabIndex = -1;
          popover.title.setAttribute("role", "heading");
          popover.title.setAttribute("aria-level", "2");
          popover.closeButton.title = "最小化";
          // 最小化とは別に、ガイド自体を終了するボタンを用意する
          const endButton = document.createElement("button");
          endButton.type = "button";
          endButton.className = "tutorial-end-button";
          endButton.textContent = "チュートリアルを終了する";
          endButton.addEventListener("click", () => finish());
          popover.footer.appendChild(endButton);
        },
        onHighlighted: (element) => {
          // driver.js は光らせた部品の親がスクロールする枠だと、スクロールを止める（overflow: hidden）。
          // リザルトのように画面の中身がその枠に入っている画面では、下まで見られなくなるため止めない
          for (const parent of document.querySelectorAll<HTMLElement>(".driver-active-element-parent-no-scroll")) {
            parent.classList.remove("driver-active-element-parent-no-scroll");
            parent.classList.add("tutorial-scrollable");
          }
          if (element instanceof HTMLElement) {
            const rect = element.getBoundingClientRect();
            if (rect.top < 0 || rect.bottom > window.innerHeight) {
              element.scrollIntoView({ behavior: motion.matches ? "instant" : "smooth", block: "center", inline: "nearest" });
            }
          }
          instance?.refresh();
          document.querySelector<HTMLElement>(".festival-tour")?.focus({ preventScroll: true });
        },
      });
      setTour(instance);
    }).catch(() => { if (!disposed) finish(); });
    const updateMotion = () => instance?.setConfig({ ...instance.getConfig(), animate: !motion.matches, smoothScroll: !motion.matches });
    let scrollFrame = 0;
    const refreshAfterScroll = () => {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(() => instance?.refresh());
    };
    // Pages can scroll inside body or nested panels, not just window. Keep the
    // click-through cutout attached to its real control in every scroll owner.
    document.addEventListener("scroll", refreshAfterScroll, true);
    motion.addEventListener("change", updateMotion);
    return () => {
      disposed = true;
      cancelAnimationFrame(scrollFrame);
      document.removeEventListener("scroll", refreshAfterScroll, true);
      motion.removeEventListener("change", updateMotion);
      instance?.destroy();
    };
  }, [steps, advance, finish, minimize]);

  useEffect(() => {
    const index = steps.findIndex((step) => step.id === stepId);
    const step = steps[index];
    if (!tour || !step || step.path !== pathname) return;
    saveActiveTutorialStep(stepId);
    let target: Element | null = null;
    // Keep the highlighted real controls keyboard accessible; other controls must
    // not bypass the practice sequence. Driver's own focus loop includes target.
    const previous = new Map<HTMLElement, boolean>();
    const updateControls = () => {
      target = typeof step.element === "string" ? document.querySelector(step.element) : null;
      for (const element of document.querySelectorAll<HTMLElement>(".app button, .app a, .app input, .app select, .app textarea, .app [tabindex]")) {
        if (!previous.has(element)) previous.set(element, element.inert);
        element.inert = target?.contains(element) ? previous.get(element)! : true;
      }
      // driver.js は光らせていない部分の指を全部受け流すため、中の枠でスクロールする画面（リザルトなど）は
      // その枠を指で動かせない。スクロールできる枠だけ指を受けられるようにする（ボタンは上の inert で押せない）
      for (const element of document.querySelectorAll<HTMLElement>(".app *")) {
        const { overflowX, overflowY } = getComputedStyle(element);
        if (/auto|scroll/.test(overflowY + overflowX)) element.classList.add("tutorial-scrollable");
      }
    };
    updateControls();
    const observer = new MutationObserver(updateControls);
    const app = document.querySelector(".app");
    if (app) observer.observe(app, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-tutorial"] });
    tour.setConfig({ ...tour.getConfig(), overlayOpacity: stepId === "battle" ? .42 : .68 });
    const onSliderTab = (event: KeyboardEvent) => {
      if (stepId !== "confirm" || event.key !== "Tab") return;
      const close = document.querySelector<HTMLElement>(".festival-tour .driver-popover-close-btn");
      const slider = target?.querySelector<HTMLInputElement>('input[type="range"]');
      const controls = [close, slider].filter((element): element is HTMLElement => !!element && !element.hasAttribute("disabled"));
      if (!controls.length) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const current = controls.indexOf(document.activeElement as HTMLElement);
      controls[(current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length].focus({ preventScroll: true });
    };
    window.addEventListener("keydown", onSliderTab, true);
    const frame = requestAnimationFrame(() => tour.drive(index));
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onSliderTab, true);
      observer.disconnect();
      previous.forEach((inert, element) => { element.inert = inert; });
      document.querySelectorAll(".tutorial-scrollable").forEach((element) => element.classList.remove("tutorial-scrollable"));
    };
  }, [tour, stepId, steps, pathname]);

  return null;
}

// ガイドを閉じたあと、いつでも続きから再開・終了できる帯
function MinimizedTutorialBar({ onResume, onFinish }: { onResume: () => void; onFinish: () => void }) {
  return (
    <div className="tutorial-minimized" role="region" aria-label="遊び方ガイド">
      <span className="tutorial-minimized-text">
        <strong>遊び方ガイドを閉じました</strong>
        <span>続きから練習できます</span>
      </span>
      <span className="tutorial-minimized-actions">
        <button type="button" className="tutorial-minimized-resume" onClick={onResume}>
          ガイドを再開
        </button>
        <button type="button" className="tutorial-minimized-end" onClick={onFinish}>
          終了する
        </button>
      </span>
    </div>
  );
}

export default function GameTutorial({ children }: { children: ReactNode }) {
  const { campusId, reloadSelection } = useGame();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const questId = PRACTICE_QUEST_ID;
  const steps = useMemo(() => createTutorialSteps(questId), [questId]);
  const [seen, setSeen] = useState(hasSeenTutorial);
  const [requestedStep, setRequestedStep] = useState<string | null>(() => readActiveTutorialStep(pathname, steps));
  // ×で閉じた（最小化した）状態。練習は続いているので、いつでも再開できる
  const [minimized, setMinimized] = useState(false);
  // QRの案内がホームに出ている間は、閉じるまで最初のガイドを始めない（ガイドに隠れて読めなくなるため）
  const { qrNotice } = useQrNotice();
  const step = requestedStep ?? (!seen && campusId && pathname === "/" && !qrNotice ? "welcome" : null);
  const active = step !== null && campusId !== null;
  const restoreFocus = useRef(false);

  const finish = useCallback((completed = false) => {
    saveTutorialStatus(completed);
    setSeen(true);
    setRequestedStep(null);
    setMinimized(false);
    restoreFocus.current = true;
    // 練習中にエリアを選び直していたら、その選択を本番の画面にも反映する
    reloadSelection();
    navigate("/", { replace: true });
  }, [navigate, reloadSelection]);

  const minimize = useCallback(() => setMinimized(true), []);

  const startTutorial = useCallback(() => {
    clearPractice();
    saveActiveTutorialStep("welcome");
    setRequestedStep("welcome");
    setMinimized(false);
    navigate("/", { replace: true });
  }, [navigate]);

  const resumeTutorial = useCallback(() => {
    setMinimized(false);
    // 別の画面を見ているときは、ガイドの画面へ戻してから再開する
    const current = steps.find((item) => item.id === step);
    if (current && current.path !== pathname) navigate(current.path, { replace: true });
  }, [steps, step, pathname, navigate]);

  const advance = useCallback((action: string) => {
    setRequestedStep((current) => {
      const index = steps.findIndex((item) => item.id === (current ?? "welcome"));
      return steps[index]?.action === action ? steps[index + 1]?.id ?? current : current;
    });
  }, [steps]);

  useLayoutEffect(() => {
    if (active) {
      window.scrollTo(0, 0);
      document.body.scrollTo(0, 0);
    }
  }, [pathname, active]);

  useEffect(() => {
    if (!active && pathname === "/" && restoreFocus.current) {
      restoreFocus.current = false;
      window.scrollTo(0, 0);
      document.body.scrollTo(0, 0);
      document.querySelector<HTMLElement>('[data-tutorial="home-menu"]')?.focus({ preventScroll: true });
    }
  }, [pathname, active]);

  // Browser history exits practice; normal step changes come only from the
  // screen's own successful action, never from an explanation's next button.
  // 最小化中は自由に見て回れるよう、戻る操作ではガイドを終了しない
  useEffect(() => {
    if (!active || minimized) return;
    const onBack = () => finish();
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, [active, minimized, finish]);

  const value = useMemo(() => ({ startTutorial, active, minimized, step, questId, advance }), [startTutorial, active, minimized, step, questId, advance]);
  return (
    <GameTutorialContext.Provider value={value}>
      {active ? <GameProvider practiceCampus={campusId}>
        <BattleSessionProvider practice>
        <div className="tutorial-scene" key={pathname}>{children}</div>
        {minimized
          ? <MinimizedTutorialBar onResume={resumeTutorial} onFinish={() => finish()} />
          : <TutorialOverlay stepId={step!} steps={steps} advance={advance} finish={finish} minimize={minimize} />}
        </BattleSessionProvider>
      </GameProvider> : children}
    </GameTutorialContext.Provider>
  );
}

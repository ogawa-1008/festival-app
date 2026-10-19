import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Driver } from "driver.js";
import { GameProvider, useGame } from "../../context/GameContext";
import { GameTutorialContext } from "./useGameTutorial";
import { clearPractice, createTutorialSteps, hasSeenTutorial, readActiveTutorialStep, saveActiveTutorialStep, saveTutorialStatus, type TutorialStep } from "./tutorialSteps";
import "driver.js/dist/driver.css";
import "../Festival/FestivalDesign.css";
import "./GameTutorial.css";

function TutorialOverlay({ stepId, steps, advance, finish }: {
  stepId: string; steps: TutorialStep[]; advance: (action: string) => void; finish: (completed?: boolean) => void;
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
        closeBtnLabel: "遊び方ガイドを終了する",
        onNextClick: (_element, _step, { index }) => {
          if (index === 0) advance("begin");
          else if (index === steps.length - 1) finish(true);
        },
        onPrevClick: () => {},
        onCloseClick: () => finish(),
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
        },
        onHighlighted: (element) => {
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
  }, [steps, advance, finish]);

  useEffect(() => {
    const index = steps.findIndex((step) => step.id === stepId);
    const step = steps[index];
    if (!tour || !step || step.path !== pathname) return;
    saveActiveTutorialStep(stepId);
    const target = typeof step.element === "string" ? document.querySelector(step.element) : null;
    // Keep the highlighted real controls keyboard accessible; other controls must
    // not bypass the practice sequence. Driver's own focus loop includes target.
    const blocked = Array.from(document.querySelectorAll<HTMLElement>(".app button, .app a, .app input, .app select, .app textarea, .app [tabindex]"))
      .filter((element) => !target?.contains(element));
    const previous = blocked.map((element) => element.inert);
    blocked.forEach((element) => { element.inert = true; });
    tour.setConfig({ ...tour.getConfig(), overlayOpacity: stepId === "battle" ? .42 : .68 });
    const frame = requestAnimationFrame(() => tour.drive(index));
    return () => {
      cancelAnimationFrame(frame);
      blocked.forEach((element, i) => { element.inert = previous[i]; });
    };
  }, [tour, stepId, steps, pathname]);

  return null;
}

export default function GameTutorial({ children }: { children: ReactNode }) {
  const { campusId, quests } = useGame();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const questId = quests[0]?.id ?? "quest-001";
  const steps = useMemo(() => createTutorialSteps(questId), [questId]);
  const [seen, setSeen] = useState(hasSeenTutorial);
  const [requestedStep, setRequestedStep] = useState<string | null>(() => readActiveTutorialStep(pathname, steps));
  const step = requestedStep ?? (!seen && campusId && pathname === "/" ? "welcome" : null);
  const active = step !== null && campusId !== null;
  const restoreFocus = useRef(false);

  const finish = useCallback((completed = false) => {
    saveTutorialStatus(completed);
    setSeen(true);
    setRequestedStep(null);
    restoreFocus.current = true;
    navigate("/", { replace: true });
  }, [navigate]);

  const startTutorial = useCallback(() => {
    clearPractice();
    saveActiveTutorialStep("welcome");
    setRequestedStep("welcome");
    navigate("/", { replace: true });
  }, [navigate]);

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
  useEffect(() => {
    if (!active) return;
    const onBack = () => finish();
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, [active, finish]);

  const value = useMemo(() => ({ startTutorial, active, step, questId, advance }), [startTutorial, active, step, questId, advance]);
  return (
    <GameTutorialContext.Provider value={value}>
      {active ? <GameProvider practiceCampus={campusId}>
        <div className="tutorial-scene" key={pathname}>{children}</div>
        <TutorialOverlay stepId={step!} steps={steps} advance={advance} finish={finish} />
      </GameProvider> : children}
    </GameTutorialContext.Provider>
  );
}

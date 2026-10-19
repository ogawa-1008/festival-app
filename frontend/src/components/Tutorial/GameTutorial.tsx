import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Driver } from "driver.js";
import { useGame } from "../../context/GameContext";
import { GameTutorialContext } from "./useGameTutorial";
import { createTutorialSteps, hasSeenTutorial, readActiveTutorialStep, saveActiveTutorialStep, saveTutorialStatus } from "./tutorialSteps";
import "driver.js/dist/driver.css";
import "../Festival/FestivalDesign.css";
import "./GameTutorial.css";

export default function GameTutorial({ children }: { children: ReactNode }) {
  const { campusId, quests } = useGame();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const sampleQuestId = quests[0]?.id;
  const steps = useMemo(() => createTutorialSteps(sampleQuestId ?? ""), [sampleQuestId]);
  const [seen, setSeen] = useState(hasSeenTutorial);
  const [requestedStep, setRequestedStep] = useState<number | null>(() => readActiveTutorialStep(pathname, steps));
  const restoreFocus = useRef(false);
  // The initial step is derived from the arrival on Home after campus selection.
  const activeStep = requestedStep ?? (!seen && campusId && pathname === "/" ? 0 : null);

  const finish = useCallback((completed = false) => {
    saveTutorialStatus(completed);
    restoreFocus.current = true;
    setSeen(true);
    setRequestedStep(null);
    navigate("/", { replace: true });
  }, [navigate]);

  const start = useCallback(() => {
    saveActiveTutorialStep(0);
    setRequestedStep(0);
    navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (activeStep === null || !campusId || !sampleQuestId || steps[activeStep].path !== pathname) return;

    let disposed = false;
    let tour: Driver | undefined;
    let frame: number | undefined;
    const app = document.querySelector<HTMLElement>(".app");
    const wasInert = app?.inert ?? false;

    const moveTo = (index: number) => {
      if (index >= steps.length) {
        finish(true);
        return;
      }
      if (index < 0) return;
      saveActiveTutorialStep(index);
      setRequestedStep(index);
      if (steps[index].path !== pathname) navigate(steps[index].path, { replace: true });
    };

    // Load the library only when a guide is actually requested.
    void import("driver.js").then(({ driver }) => {
      if (disposed) return;
      tour = driver({
        steps,
        animate: false,
        smoothScroll: false,
        overlayColor: "#080606",
        overlayOpacity: .78,
        overlayClickBehavior: "none",
        disableActiveInteraction: true,
        stagePadding: 8,
        stageRadius: 4,
        popoverClass: "festival-tour festival-ui",
        popoverOffset: 14,
        showProgress: true,
        progressText: "{{current}} / {{total}}",
        nextBtnText: "次へ",
        prevBtnText: "戻る",
        doneBtnText: "クエストへ出発",
        closeBtnLabel: "遊び方ガイドを終了する",
        onNextClick: () => moveTo(activeStep + 1),
        onPrevClick: () => moveTo(activeStep - 1),
        onCloseClick: () => finish(),
        onDestroyed: () => { if (!disposed) finish(); },
        onPopoverRender: (popover) => {
          popover.wrapper.setAttribute("role", "dialog");
          popover.wrapper.setAttribute("aria-modal", "true");
          popover.wrapper.setAttribute("aria-labelledby", popover.title.id);
          popover.wrapper.setAttribute("aria-describedby", popover.description.id);
          popover.title.setAttribute("role", "heading");
          popover.title.setAttribute("aria-level", "2");
        },
        onHighlighted: () => {
          saveActiveTutorialStep(activeStep);
          document.querySelector<HTMLButtonElement>(".festival-tour .driver-popover-next-btn")?.focus({ preventScroll: true });
        },
      });
      frame = requestAnimationFrame(() => {
        if (disposed) return;
        // Driver renders outside .app; keep every real game action out of reach,
        // including keyboard activation of camera, hands and exchange buttons.
        if (app) app.inert = true;
        tour?.drive(activeStep);
      });
    }).catch(() => {
      // A failed optional guide must not block the game. It remains replayable.
      if (!disposed) finish();
    });

    return () => {
      disposed = true;
      if (frame !== undefined) cancelAnimationFrame(frame);
      if (app) app.inert = wasInert;
      tour?.destroy();
    };
  }, [activeStep, campusId, finish, navigate, pathname, sampleQuestId, steps]);

  useEffect(() => {
    if (activeStep === null && pathname === "/" && restoreFocus.current) {
      restoreFocus.current = false;
      window.scrollTo(0, 0);
      document.querySelector<HTMLElement>('[data-tutorial="home-menu"]')?.focus({ preventScroll: true });
    }
  }, [activeStep, pathname]);

  return <GameTutorialContext.Provider value={start}>{children}</GameTutorialContext.Provider>;
}

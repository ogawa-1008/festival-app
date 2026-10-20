import { useEffect, useRef, useState } from "react";
import { getExpAnimationFrame } from "../../utils/hunterRankAnimation";

export function useExpRewardAnimation() {
  const [frame, setFrame] = useState<ReturnType<typeof getExpAnimationFrame> | null>(null);
  const requestId = useRef<number | null>(null);

  useEffect(() => () => {
    if (requestId.current !== null) cancelAnimationFrame(requestId.current);
  }, []);

  function animateReward(fromExp: number, gainedExp: number) {
    if (requestId.current !== null) cancelAnimationFrame(requestId.current);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const firstFrame = getExpAnimationFrame(fromExp, gainedExp, reducedMotion.matches ? Infinity : 0);
    setFrame(firstFrame);
    if (!firstFrame.isAnimating) return;

    let start: number | null = null;
    const tick = (time: number) => {
      start ??= time;
      const next = getExpAnimationFrame(fromExp, gainedExp, reducedMotion.matches ? Infinity : time - start);
      setFrame(next);
      requestId.current = next.isAnimating ? requestAnimationFrame(tick) : null;
    };
    requestId.current = requestAnimationFrame(tick);
  }

  return { frame, animateReward };
}

import { useEffect, useState } from "react";

// until（ミリ秒の時刻）まで待ち時間中かを返す
// タイマーが早めに発火しても、時刻を確かめて残りがあれば待ち直す
export function useCooldown(until: number) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;

    const check = () => {
      const current = Date.now();

      setNow(current);

      if (current < until) {
        timerId = setTimeout(check, until - current);
      }
    };

    // until が変わった直後も最新の時刻で判定し直す
    timerId = setTimeout(check, 0);

    return () => clearTimeout(timerId);
  }, [until]);

  const remaining = Math.max(0, until - now);

  return { isWaiting: remaining > 0, remaining };
}

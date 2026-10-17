import { useEffect, useState } from "react";

// until（ミリ秒の時刻）まで待ち時間中かを返す。duration はその待ち時間の長さ
// タイマーが早めに発火しても、時刻を確かめて残りがあれば待ち直す
export function useCooldown(until: number, duration: number) {
  const [state, setState] = useState(() => ({ until, now: Date.now() }));

  // until が変わった直後は、古い時刻で計算しないよう「待ち時間がいま始まった」とみなす
  // （until は「操作した時刻 + duration」で決まるため、その時刻は until - duration 以降）
  if (state.until !== until) {
    setState({ until, now: Math.max(state.now, until - duration) });
  }

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;

    const check = () => {
      const now = Date.now();

      setState({ until, now });

      if (now < until) {
        timerId = setTimeout(check, until - now);
      }
    };

    timerId = setTimeout(check, 0);

    return () => clearTimeout(timerId);
  }, [until]);

  const remaining = Math.max(0, until - state.now);

  return { isWaiting: remaining > 0, remaining };
}

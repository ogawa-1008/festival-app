import {
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

import "./SwipeToConfirm.css";

type SwipeToConfirmProps = {
  label: string;
  confirmedLabel: string;
  disabled?: boolean;
  // 確定したときに呼ぶ。false を返したら確定を取り消してつまみを戻す
  onConfirm: () => boolean;
};

// つまみが動ける幅のうち、ここまで動かして離したら確定する
const CONFIRM_THRESHOLD = 0.9;

// キーボード・読み上げ機能は10段階で右端まで進む
const KEY_STEPS = 10;

// 右端までスライドして離すと確定するボタン（誤操作防止）
// 操作と読み上げは画面に見えない標準のスライダーが受け持ち、見えているつまみは指・マウス用
function SwipeToConfirm({
  label,
  confirmedLabel,
  disabled = false,
  onConfirm,
}: SwipeToConfirmProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startProgress: number;
  } | null>(null);

  // 0（左端）〜 1（右端）。離した瞬間の判定に使うため Ref でも最新値を持つ
  const [progress, setProgressState] = useState(0);
  const progressRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  // つまみが動ける幅（px）。動かすたびに測らないよう、大きさが変わったときだけ測る
  const [travel, setTravel] = useState(0);

  const isLocked = disabled || isConfirmed;

  const setProgress = (value: number) => {
    progressRef.current = value;
    setProgressState(value);
  };

  useLayoutEffect(() => {
    const track = trackRef.current;
    const knob = knobRef.current;

    if (!track || !knob) return;

    // 枠の内幅から、つまみと左右の余白を引いた幅
    const measure = () => {
      setTravel(Math.max(0, track.clientWidth - knob.offsetWidth - knob.offsetLeft * 2));
    };

    measure();

    const observer = new ResizeObserver(measure);

    observer.observe(track);

    return () => observer.disconnect();
  }, []);

  const confirm = () => {
    // 確定は1回だけ。呼び出し側が失敗を返したら戻す
    setIsConfirmed(true);
    setProgress(1);

    if (!onConfirm()) {
      setIsConfirmed(false);
      setProgress(0);
      return;
    }

    navigator.vibrate?.(30);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    // 最初の1本の指（マウスなら左ボタン）だけを受け付ける
    if (
      isLocked ||
      dragRef.current ||
      !event.isPrimary ||
      (event.pointerType === "mouse" && event.button !== 0)
    ) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startProgress: progressRef.current,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId || isLocked || travel <= 0) return;

    const next = drag.startProgress + (event.clientX - drag.startX) / travel;

    setProgress(Math.min(1, Math.max(0, next)));
  };

  // 指を離したときだけ判定する（動かしている途中では確定しない）
  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    setIsDragging(false);

    // 操作の途中で無効になった場合は確定せずに戻す
    if (isLocked) {
      if (!isConfirmed) setProgress(0);
      return;
    }

    if (event.type === "pointerup" && progressRef.current >= CONFIRM_THRESHOLD) {
      confirm();
    } else {
      setProgress(0);
    }
  };

  // キーボード・読み上げ機能からの操作。右端（100）に達したら確定する
  const handleRangeChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return;

    const next = Number(event.target.value) / 100;

    if (next >= 1) {
      confirm();
    } else {
      setProgress(next);
    }
  };

  // キーの押しっぱなし（自動連打）では進めない。Enter でも確定しない
  const handleRangeKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.repeat) event.preventDefault();
  };

  // 途中でフォーカスが外れたら戻す
  const handleRangeBlur = () => {
    setIsFocused(false);

    if (!isConfirmed && !dragRef.current) setProgress(0);
  };

  // 無効になっている間は（操作の途中でも）つまみを左端に表示する
  const shownProgress = disabled && !isConfirmed ? 0 : progress;
  const percent = Math.round(shownProgress * 100);

  return (
    <div
      ref={trackRef}
      className={[
        "swipe-confirm",
        isDragging && !disabled ? "swipe-confirm-dragging" : "",
        isConfirmed ? "swipe-confirm-done" : "",
        isFocused ? "swipe-confirm-focused" : "",
        disabled ? "swipe-confirm-disabled" : "",
      ].join(" ")}
      style={{
        "--swipe-progress": shownProgress,
        "--swipe-offset": `${shownProgress * travel}px`,
      } as CSSProperties}
    >
      <input
        type="range"
        className="swipe-confirm-input"
        min={0}
        max={100}
        step={100 / KEY_STEPS}
        value={Math.round(shownProgress * KEY_STEPS) * (100 / KEY_STEPS)}
        aria-label={label}
        aria-valuetext={isConfirmed ? confirmedLabel : `${percent}%`}
        disabled={isLocked}
        onChange={handleRangeChange}
        onKeyDown={handleRangeKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={handleRangeBlur}
      />

      <div className="swipe-confirm-fill" aria-hidden="true" />

      <span className="swipe-confirm-label" aria-hidden="true">
        {isConfirmed ? confirmedLabel : label}
      </span>

      <div
        ref={knobRef}
        className="swipe-confirm-knob"
        aria-hidden="true"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        {isConfirmed ? "✓" : "▶"}
      </div>
    </div>
  );
}

export default SwipeToConfirm;

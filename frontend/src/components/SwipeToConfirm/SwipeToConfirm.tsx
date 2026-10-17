import {
  useRef,
  useState,
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

// キーボードは矢印キー10回で右端まで進む
const KEY_STEPS = 10;

// 右端までスライドして離すと確定するボタン（誤操作防止）
function SwipeToConfirm({
  label,
  confirmedLabel,
  disabled = false,
  onConfirm,
}: SwipeToConfirmProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startProgress: number } | null>(null);

  // 0（左端）〜 1（右端）。離した瞬間の判定に使うため Ref でも最新値を持つ
  const [progress, setProgressState] = useState(0);
  const progressRef = useRef(0);

  const setProgress = (value: number) => {
    progressRef.current = value;
    setProgressState(value);
  };
  const [isDragging, setIsDragging] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const isLocked = disabled || isConfirmed;

  // つまみが動ける幅（px）。枠の内幅から、つまみと左右の余白を引いたもの
  const getTravel = () => {
    const track = trackRef.current;
    const knob = knobRef.current;

    if (!track || !knob) return 1;

    return Math.max(1, track.clientWidth - knob.offsetWidth - knob.offsetLeft * 2);
  };

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

  const finish = () => {
    if (progressRef.current >= CONFIRM_THRESHOLD) {
      confirm();
    } else {
      setProgress(0);
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (isLocked) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startX: event.clientX, startProgress: progressRef.current };
    setIsDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;

    if (!drag || isLocked) return;

    const next = drag.startProgress + (event.clientX - drag.startX) / getTravel();

    setProgress(Math.min(1, Math.max(0, next)));
  };

  // 指を離したときだけ判定する（動かしている途中では確定しない）
  const handlePointerEnd = () => {
    if (!dragRef.current) return;

    dragRef.current = null;
    setIsDragging(false);

    if (!isLocked) finish();
  };

  // キーボードは右矢印で少しずつ進め、右端で確定する（Enter 1回では確定しない）
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isLocked) return;

    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();

      // 小数を足し続けると誤差で右端（1）に届かないため、段階数で計算する
      const step = Math.round(progressRef.current * KEY_STEPS)
        + (event.key === "ArrowRight" ? 1 : -1);
      const next = Math.min(KEY_STEPS, Math.max(0, step)) / KEY_STEPS;

      if (next >= 1) {
        confirm();
      } else {
        setProgress(next);
      }
    }
  };

  // 途中でフォーカスが外れたら戻す
  const handleBlur = () => {
    if (!isConfirmed && !dragRef.current) setProgress(0);
  };

  const percent = Math.round(progress * 100);

  return (
    <div
      ref={trackRef}
      className={[
        "swipe-confirm",
        isDragging ? "swipe-confirm-dragging" : "",
        isConfirmed ? "swipe-confirm-done" : "",
        disabled ? "swipe-confirm-disabled" : "",
      ].join(" ")}
      style={{ "--swipe-progress": progress } as CSSProperties}
    >
      <div className="swipe-confirm-fill" aria-hidden="true" />

      <span className="swipe-confirm-label" aria-hidden="true">
        {isConfirmed ? confirmedLabel : label}
      </span>

      <div
        ref={knobRef}
        className="swipe-confirm-knob"
        role="slider"
        tabIndex={isLocked ? -1 : 0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={isConfirmed ? confirmedLabel : `${percent}%`}
        aria-disabled={isLocked}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      >
        {isConfirmed ? "✓" : "▶"}
      </div>
    </div>
  );
}

export default SwipeToConfirm;

import { Link } from "react-router-dom";

type ProgressActionButtonProps = {
  label: string;
  disabled?: boolean;
  // 画面を移動するときは to、その場で処理するときは onClick を渡す
  to?: string;
  onClick?: () => void;
  tutorialId?: string;
  compact?: boolean;
};

// 進捗の各ページで使う共通の作成・交換ボタン（武器の作成ボタンの見た目）
function ProgressActionButton({
  label,
  disabled = false,
  to,
  onClick,
  tutorialId,
  compact = false,
}: ProgressActionButtonProps) {
  const className = `progress-action-button${compact ? " is-compact" : ""}`;

  return (
    <div className={`progress-action-area${compact ? " is-compact" : ""}`}>
      {to && !disabled ? (
        <Link className={className} to={to} data-tutorial={tutorialId} onClick={onClick}>
          {label}
        </Link>
      ) : (
        <button
          type="button"
          className={className}
          data-tutorial={tutorialId}
          onClick={onClick}
          disabled={disabled}
        >
          {label}
        </button>
      )}
    </div>
  );
}

export default ProgressActionButton;

// カメラが使えなかったときの原因の判定と、原因ごとの案内文

export type CameraErrorKind =
  | "denied" // カメラの使用を許可しなかった
  | "not-found" // カメラがない
  | "in-use" // ほかのアプリ・タブが使用中
  | "insecure" // 安全な接続（https）ではない
  | "in-app-browser" // LINE・Instagram などのアプリ内ブラウザ
  | "unknown";

export type Platform = "ios" | "android" | "other";

export type CameraEnvironment = {
  userAgent: string;
  isSecureContext: boolean;
  hasMediaDevices: boolean;
};

export type CameraErrorContent = {
  title: string;
  message: string;
  steps: string[];
  // 「もう一度試す」で解決する見込みがあるか（https でない・カメラがない場合はない）
  canRetry: boolean;
};

const ERROR_NAMES = [
  "NotAllowedError",
  "PermissionDeniedError",
  "SecurityError",
  "NotFoundError",
  "DevicesNotFoundError",
  "NotReadableError",
  "TrackStartError",
  "AbortError",
  "OverconstrainedError",
  "ConstraintNotSatisfiedError",
] as const;

// maxTouchPoints は navigator.maxTouchPoints を渡す（iPadOS の判定に使う）
export function detectPlatform(userAgent: string, maxTouchPoints = 0): Platform {
  // iPadOS の Safari は Mac と同じ User-Agent を名乗るため、タッチ対応の Mac も iOS とみなす
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "ios";
  if (/Macintosh/i.test(userAgent) && maxTouchPoints > 1) return "ios";
  if (/Android/i.test(userAgent)) return "android";
  return "other";
}

export function isInAppBrowser(userAgent: string) {
  return /Line\/|Instagram|FBAN|FBAV|FB_IAB|Twitter|TikTok|BytedanceWebview|musical_ly/i.test(userAgent);
}

// エラーの名前を取り出す。html5-qrcode は
// "Error getting userMedia, error = NotAllowedError: Permission denied" のような文字列で失敗を返す
export function getCameraErrorName(error: unknown): string | null {
  if (error && typeof error === "object" && "name" in error) {
    const name = String((error as { name: unknown }).name);

    if ((ERROR_NAMES as readonly string[]).includes(name)) return name;
  }

  const text =
    error instanceof Error ? `${error.name} ${error.message}` : String(error ?? "");

  return ERROR_NAMES.find((name) => text.includes(name)) ?? null;
}

// カメラの機能そのものが使えるか（https でない・アプリ内ブラウザが対応していない場合は使えない）
// カメラを起動する前から分かるので、画面を開いた時点の判定にも使う
export function classifyEnvironment(environment: CameraEnvironment): CameraErrorKind | null {
  if (environment.isSecureContext && environment.hasMediaDevices) return null;

  return isInAppBrowser(environment.userAgent) ? "in-app-browser" : "insecure";
}

// カメラの使用を拒否されたときの原因
// アプリ内ブラウザはカメラを拒否することが多いので、ブラウザで開き直すよう案内する
export function classifyPermissionDenied(userAgent: string): CameraErrorKind {
  return isInAppBrowser(userAgent) ? "in-app-browser" : "denied";
}

export function classifyCameraError(
  error: unknown,
  environment: CameraEnvironment
): CameraErrorKind {
  const environmentError = classifyEnvironment(environment);

  if (environmentError) return environmentError;

  const inApp = isInAppBrowser(environment.userAgent);

  switch (getCameraErrorName(error)) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return classifyPermissionDenied(environment.userAgent);
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
    case "ConstraintNotSatisfiedError":
      return "not-found";
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return "in-use";
    // SecurityError は iframe などの制限によるもので、ユーザーが許可し直しても解決しないため「その他」とする
    default:
      return inApp ? "in-app-browser" : "unknown";
  }
}

const RETRY_STEP = "この画面に戻り「もう一度試す」を押す";

export function getCameraErrorContent(
  kind: CameraErrorKind,
  platform: Platform
): CameraErrorContent {
  switch (kind) {
    case "denied":
      return {
        title: "カメラの使用が許可されていません",
        message: "QRコードを読み取るには、このページでのカメラの使用を許可してください。",
        canRetry: true,
        steps:
          platform === "ios"
            ? [
                "アドレスバーの「ぁあ」（または「ページ設定」）をタップ",
                "「Webサイトの設定」→「カメラ」を「許可」にする",
                RETRY_STEP,
              ]
            : platform === "android"
              ? [
                  "アドレスバー左の鍵（または設定）アイコンをタップ",
                  "「権限」→「カメラ」を「許可」にする",
                  RETRY_STEP,
                ]
              : [
                  "アドレスバーのカメラ（または鍵）のアイコンを押す",
                  "カメラを「許可」にする",
                  RETRY_STEP,
                ],
      };
    case "not-found":
      return {
        title: "カメラが見つかりません",
        message: "この端末ではカメラを使えませんでした。カメラのあるスマートフォンで開いてください。",
        canRetry: false,
        steps: [],
      };
    case "in-use":
      return {
        title: "カメラを起動できませんでした",
        message: "ほかのアプリやタブでカメラを使っている可能性があります。",
        canRetry: true,
        steps: [
          "カメラを使っているアプリ（ビデオ通話・カメラアプリなど）を閉じる",
          "ほかのタブでこのページを開いていれば閉じる",
          RETRY_STEP,
        ],
      };
    case "insecure":
      return {
        title: "このページではカメラを使えません",
        message: "安全な接続（https）で開かれていないため、カメラを使えません。",
        canRetry: false,
        steps: ["会場の案内にあるURL（https:// で始まるもの）から開き直す"],
      };
    case "in-app-browser":
      return {
        title: "ブラウザで開き直してください",
        message: "LINE・Instagram などのアプリの中のブラウザでは、カメラを使えないことがあります。",
        canRetry: true,
        steps:
          platform === "android"
            ? [
                "画面右上のメニュー（︙ または …）を押す",
                "「Chromeで開く」（または「ブラウザで開く」）を選ぶ",
                "開いたページで「カメラを起動」を押す",
              ]
            : [
                "画面の右上か右下にあるメニュー（… または 共有）を押す",
                "「Safariで開く」（または「ブラウザで開く」）を選ぶ",
                "開いたページで「カメラを起動」を押す",
              ],
      };
    default:
      return {
        title: "カメラを起動できませんでした",
        message: "一時的な問題の可能性があります。",
        canRetry: true,
        steps: ["ページを再読み込みする", "「もう一度試す」を押す"],
      };
  }
}

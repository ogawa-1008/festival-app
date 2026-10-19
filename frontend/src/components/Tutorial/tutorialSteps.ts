import type { DriveStep } from "driver.js";

export const tutorialStorageKey = "festival-game-tutorial:v1";
const activeTutorialKey = "festival-game-tutorial:active:v2";
export const practiceStorageKey = "festival-game-tutorial:game:v2";
export type TutorialStep = DriveStep & { id: string; path: string; action?: string };

export function readActiveTutorialStep(pathname: string, steps: TutorialStep[]) {
  try {
    const saved = sessionStorage.getItem(activeTutorialKey);
    return steps.some((step) => step.id === saved && step.path === pathname) ? saved : null;
  } catch { return null; }
}
export function saveActiveTutorialStep(id: string) {
  try { sessionStorage.setItem(activeTutorialKey, id); } catch { /* Storage is optional. */ }
}
export function clearPractice() {
  try {
    sessionStorage.removeItem(activeTutorialKey);
    sessionStorage.removeItem(practiceStorageKey);
  } catch { /* The in-memory session still works. */ }
}
export function hasSeenTutorial() {
  try { return ["completed", "dismissed"].includes(localStorage.getItem(tutorialStorageKey) ?? ""); }
  catch { return false; }
}
export function saveTutorialStatus(completed: boolean) {
  try { localStorage.setItem(tutorialStorageKey, completed ? "completed" : "dismissed"); }
  catch { /* The in-memory session still works. */ }
  clearPractice();
}
export function createTutorialSteps(questId: string): TutorialStep[] {
  return [
    { id: "welcome", path: "/", action: "begin", popover: {
      title: "操作を体験しよう",
      description: "光っているボタンを実際に押して、狩猟から特典交換まで練習しましょう。<br><br>練習用のQRと素材を使います。実際のカメラ・報酬・交換履歴には影響しません。×でいつでも終了できます。",
      showButtons: ["next", "close"], nextBtnText: "練習を始める",
    } },
    { id: "map", path: "/", action: "nav-map", element: '[data-tutorial="nav-map"]', popover: {
      title: "会場を確認しよう", description: "まずは「マップ」を押して、モンスターがいるフィールドを確認しましょう。", side: "top",
    } },
    { id: "field", path: "/map", action: "field-open", element: '[data-tutorial="map-field"]', popover: {
      title: "フィールドを開く", description: "このフィールドを押してみましょう。場所やモンスターの情報が開きます。", side: "top",
    } },
    { id: "map-home", path: "/map", action: "nav-home", element: '[data-tutorial="nav-home"]', popover: {
      title: "クエストへ向かおう", description: "フィールドの情報を確認できました。「ホーム」を押してクエストを選びましょう。", side: "top",
    } },
    { id: "quest", path: "/", action: "quest-open", element: `[data-tutorial-quest="${questId}"]`, popover: {
      title: "クエストを選ぶ", description: "このクエストを押してください。QRコードの読み取り画面へ進みます。", side: "top",
    } },
    { id: "camera", path: "/qr-scanner", action: "camera-start", element: '[data-tutorial="camera-start"]', popover: {
      title: "カメラを起動する", description: "「カメラを起動」を押しましょう。今回は練習用の映像が開きます。本番ではカメラの使用を許可してください。", side: "top",
    } },
    { id: "scan", path: "/qr-scanner", action: "qr-scanned", element: '[data-tutorial="practice-scan"]', popover: {
      title: "QRを読み取る", description: "練習用QRを押して、読み取りを体験しましょう。本番では会場のQRを枠に合わせると自動で読み取ります。", side: "top",
    } },
    { id: "loading", path: `/quest-loading/${questId}`, action: "battle-ready", element: ".departure-heading", popover: {
      title: "狩猟フィールドへ", description: "QRを読み取れました。準備が整うとバトルが始まります。少しお待ちください。", side: "bottom",
    } },
    { id: "battle", path: `/battle/${questId}`, action: "battle-finished", element: '[data-tutorial="battle-hands"]', popover: {
      title: "手を選んで狩猟しよう", description: "手を押して、あいこ・負け・勝ちを練習。勝つと相手、負けると自分のHPが減ります。相手のHPが0になるまで続けましょう。", side: "top",
      popoverClass: "festival-tour festival-ui festival-tour--battle",
    } },
    { id: "reward", path: `/result/${questId}`, action: "reward-claimed", element: '[data-tutorial="claim-reward"]', popover: {
      title: "討伐成功！", description: "獲得できる素材を確認して「報酬を受け取る」を押しましょう。今回は練習用の素材です。", side: "top",
    } },
    { id: "result-home", path: `/result/${questId}`, action: "result-home", element: '[data-tutorial="result-home"]', popover: {
      title: "素材を受け取りました", description: "「ホームへ戻る」を押してください。集めた素材で特典を交換してみましょう。", side: "top",
    } },
    { id: "progress", path: "/", action: "nav-progress", element: '[data-tutorial="nav-progress"]', popover: {
      title: "集めた素材を確認", description: "「進捗」を押すと、特典に必要な素材と所持数を確認できます。", side: "top",
    } },
    { id: "craft", path: "/progress", action: "craft-open", element: '[data-tutorial="create-weapon"]', popover: {
      title: "素材が揃いました", description: "必要な素材がすべて揃いました。「武器を作成する」を押して、特典の交換画面を開きましょう。", side: "top",
    } },
    { id: "exchange", path: "/exchange/weapon", action: "exchange-open", element: '[data-tutorial="exchange-open"]', popover: {
      title: "交換内容を確認", description: "必要な素材を確認して「特典と交換する」を押してください。確認ダイアログが開きます。", side: "top",
    } },
    { id: "confirm", path: "/exchange/weapon", action: "exchange-confirmed", element: '[data-tutorial="exchange-confirm"]', popover: {
      title: "交換を確定する", description: "「交換する」を押してみましょう。本番の交換は1回限りです。今回は練習なので実際の特典は交換されません。", side: "top",
    } },
    { id: "exchange-back", path: "/exchange/weapon", action: "exchange-back", element: '[data-tutorial="exchange-back"]', popover: {
      title: "受け取り画面を提示", description: "本番では、この交換済み画面を運営スタッフに見せて特典を受け取ります。確認できたら「武器詳細へ戻る」を押しましょう。", side: "top",
    } },
    { id: "finish-home", path: "/progress", action: "nav-home", element: '[data-tutorial="nav-home"]', popover: {
      title: "ホームへ戻ろう", description: "「ホーム」を押して、練習を終えましょう。ここまでが狩猟から特典交換までの流れです。", side: "top",
    } },
    { id: "complete", path: "/", popover: {
      title: "いざ、本番の狩猟へ", description: "操作の練習は完了です！ 会場のQRコードを探して、クエストに挑戦しましょう。<br><br>メニューの「遊び方ガイド」からいつでも練習し直せます。",
      showButtons: ["next", "close"], doneBtnText: "狩猟を始める",
    } },
  ];
}

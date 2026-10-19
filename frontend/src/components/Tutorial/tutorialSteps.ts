import type { DriveStep } from "driver.js";

export const tutorialStorageKey = "festival-game-tutorial:v1";
const activeTutorialKey = "festival-game-tutorial:active:v1";

type TutorialStep = DriveStep & { path: string };

export function readActiveTutorialStep(pathname: string, steps: TutorialStep[]) {
  try {
    const saved = sessionStorage.getItem(activeTutorialKey);
    if (saved === null) return null;
    const index = Number(saved);
    return Number.isInteger(index) && steps[index]?.path === pathname ? index : null;
  } catch {
    return null;
  }
}

export function saveActiveTutorialStep(index: number) {
  try {
    sessionStorage.setItem(activeTutorialKey, String(index));
  } catch {
    // Persistence is optional; the guide still runs in this tab.
  }
}

export function hasSeenTutorial() {
  try {
    return ["completed", "dismissed"].includes(localStorage.getItem(tutorialStorageKey) ?? "");
  } catch {
    return false;
  }
}

export function saveTutorialStatus(completed: boolean) {
  try {
    localStorage.setItem(tutorialStorageKey, completed ? "completed" : "dismissed");
  } catch {
    // The current session still works when browser storage is unavailable.
  }
  try {
    sessionStorage.removeItem(activeTutorialKey);
  } catch {
    // Storage may be disabled by browser settings.
  }
}

export function createTutorialSteps(questId: string): TutorialStep[] {
  return [
    {
      path: "/",
      popover: {
        title: "狩猟へようこそ",
        description: "QRコードを読み取って、じゃんけんでモンスターに挑戦！ 素材を集めると特典と交換できます。画面を見ながら遊び方を確認しましょう。<br><br>ガイドは右上の×で終了でき、メニューからいつでも見直せます。",
        nextBtnText: "ガイドを始める",
      },
    },
    {
      path: "/",
      element: '[data-tutorial="quest"]',
      popover: {
        title: "クエストを選ぶ",
        description: "挑戦したいクエストのカードをタップすると、QRコードの読み取り画面が開きます。会場にあるクエスト用のQRコードを探しましょう。",
        side: "bottom",
      },
    },
    {
      path: "/",
      element: '[data-tutorial="nav-map"]',
      popover: {
        title: "マップで確認",
        description: "マップでは、校舎ごとのフィールドやモンスターを確認できます。会場をまわるときに使ってみましょう。",
        side: "top",
      },
    },
    {
      path: "/qr-scanner",
      element: '[data-tutorial="qr-camera"]',
      popover: {
        title: "QRを読み取る",
        description: "「カメラを起動」を押して使用を許可し、QRコードを枠の中に合わせます。読み取り後は、準備が整うとバトルが始まります。<br><br>ガイド中はカメラを起動しません。",
        side: "bottom",
      },
    },
    {
      path: `/battle/${questId}`,
      element: '[data-tutorial="monster-hp"]',
      popover: {
        title: "討伐のルール",
        description: "じゃんけんに勝つと相手のHPが減り、0にすると討伐成功！ 負けると自分のHPが減ります。力尽きても、調査結果から素材とハンターランク経験値を獲得できます。",
        side: "bottom",
      },
    },
    {
      path: `/battle/${questId}`,
      element: '[data-tutorial="battle-hands"]',
      popover: {
        title: "手を選んで攻撃",
        description: "グーはチョキに、チョキはパーに、パーはグーに勝ちます。あいこのときは、もう一度手を選びましょう。<br><br>ガイド中の操作でバトルの結果は変わりません。",
        side: "top",
      },
    },
    {
      path: "/progress",
      element: '[data-tutorial="required-materials"]',
      popover: {
        title: "素材を集めよう",
        description: "「進捗」では、武器の特典に必要な素材と所持数を確認できます。クエストに挑戦して、必要な数を集めましょう。",
        side: "bottom",
      },
    },
    {
      path: "/progress",
      element: '[data-tutorial="create-weapon"]',
      popover: {
        title: "特典と交換",
        description: "素材が揃ったら「武器を作成する」から交換画面へ進めます。交換は1回限りです。受け取り画面を運営スタッフに提示してください。<br><br>ガイド中は素材の消費や交換は行いません。",
        side: "top",
      },
    },
    {
      path: "/",
      element: '[data-tutorial="home-menu"]',
      popover: {
        title: "さあ、出発！",
        description: "遊び方は、このメニューの「遊び方ガイド」からいつでも確認できます。素材やスタンプの一覧もここから開けます。クエストに挑戦してみましょう！",
        side: "bottom",
      },
    },
  ];
}

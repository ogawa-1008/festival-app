import { useNavigate } from "react-router-dom";
import "./BottomNavigation.css";

type PageType = "home" | "map" | "progress";

type BottomNavigationProps = {
  active: PageType;
};

/* =========================
   ホームアイコン
========================= */

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="nav-icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9 21v-7h6v7" />
    </svg>
  );
}

/* =========================
   マップアイコン
========================= */

function MapIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="nav-icon"
      fill="currentColor"
    >
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />

      <circle
        cx="12"
        cy="9"
        r="2.5"
        fill="#111"
      />
    </svg>
  );
}

/* =========================
   進捗アイコン
========================= */

function ProgressIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="nav-icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M7 16l3-4 3 2 5-7" />
    </svg>
  );
}

/* =========================
   ナビゲーション
========================= */

function BottomNavigation({
  active,
}: BottomNavigationProps) {
  const navigate = useNavigate();

  const pages: {
    key: PageType;
    label: string;
    path: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: "home",
      label: "ホーム",
      path: "/",
      icon: <HomeIcon />,
    },
    {
      key: "map",
      label: "マップ",
      path: "/map",
      icon: <MapIcon />,
    },
    {
      key: "progress",
      label: "進捗",
      path: "/progress",
      icon: <ProgressIcon />,
    },
  ];

  /*
   * 現在のページを中央にする
   */
  const activeIndex = pages.findIndex(
    (page) => page.key === active
  );

  const leftIndex =
    (activeIndex - 1 + pages.length) %
    pages.length;

  const rightIndex =
    (activeIndex + 1) %
    pages.length;

  const leftPage = pages[leftIndex];
  const activePage = pages[activeIndex];
  const rightPage = pages[rightIndex];

  return (
    <nav className="bottom-navigation">

      {/* =========================
          左ボタン
      ========================= */}

      <button
        className="nav-side-button"
        type="button"
        aria-label={leftPage.label}
        onClick={() => navigate(leftPage.path)}
      >
        {leftPage.icon}
      </button>

      {/* =========================
          中央・現在ページ
      ========================= */}

      <button
        className="nav-center-button"
        type="button"
        aria-label={activePage.label}
      >
        <div className="nav-center-icon">
          {activePage.icon}
        </div>

        <span>
          {activePage.label}
        </span>
      </button>

      {/* =========================
          右ボタン
      ========================= */}

      <button
        className="nav-side-button"
        type="button"
        aria-label={rightPage.label}
        onClick={() => navigate(rightPage.path)}
      >
        {rightPage.icon}
      </button>

    </nav>
  );
}

export default BottomNavigation;
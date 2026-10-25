import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import HunterRank from "../../components/Header/HunterRank";
import CollaborationLogo from "../../components/Logo/CollaborationLogo";
import QuestList from "../../components/Quest/QuestBoard/QuestList";
import BottomNavigation from "../../components/Navigation/BottomNavigation";
import { useGame } from "../../context/GameContext";
import { findCampus } from "../../data/campuses";
import { useGameTutorial } from "../../components/Tutorial/useGameTutorial";
import { getHistoryIndex } from "../../utils/historyIndex";

import "../../components/Header/HunterRank.css";
import "../../components/Logo/CollaborationLogo.css";
import "./Home.css";

function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { rankExp, campusId } = useGame();
  const campus = findCampus(campusId);
  const { startTutorial } = useGameTutorial();
  // 標準カメラで開いたQRが、ほかのエリアのもの・クエスト用でないものだったときの案内
  const location = useLocation();
  const qrNotice = (location.state as { qrNotice?: string } | null)?.qrNotice ?? null;

  return (
    <main className="home">
      <div className="home-background" />

      <div className="home-content">

        {/* =================================
            上部ボーダー
        ================================= */}
        <header className="home-top-bar">

          {/* ハンターランク */}
          <div className="home-rank-area">
            <HunterRank rankExp={rankExp} />
          </div>

          {/* ハンバーガーメニュー */}
          <button
            type="button"
            className="hamburger-button"
            aria-label="メニュー"
            data-tutorial="home-menu"
            onClick={() => setIsMenuOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>

        </header>


        {/* =================================
            ハンバーガーメニュー
        ================================= */}
        {isMenuOpen && (
          <div className="menu-overlay">

            {/* 背景をタップして閉じる */}
            <button
              type="button"
              className="menu-overlay-close"
              onClick={() => setIsMenuOpen(false)}
              aria-label="メニューを閉じる"
            />

            <aside className="side-menu">

              {/* メニュータイトル */}
              <div className="side-menu-title-area">
                <span className="side-menu-subtitle">
                  VANTAN × MONSTER HUNTER
                </span>

                <h2>MENU</h2>

                <div className="side-menu-title-line">
                  <span />
                  <b>◆</b>
                  <span />
                </div>
              </div>

              {/* メニュー項目 */}
              <div className="side-menu-list">
                <button
                  type="button"
                  className="side-menu-item"
                  onClick={() => {
                    setIsMenuOpen(false);
                    startTutorial();
                  }}
                >
                  <span className="side-menu-item-icon" aria-hidden="true">？</span>
                  <span className="side-menu-item-text">
                    <small>HOW TO PLAY</small>
                    <strong>遊び方ガイド</strong>
                  </span>
                  <span className="side-menu-arrow" aria-hidden="true">›</span>
                </button>
                <button
                  type="button"
                  className="side-menu-item"
                  // 戻り先としてホームの履歴の位置を渡す（エリアを決めたら1つ戻る）
                  onClick={() => navigate("/start", { state: { returnIdx: getHistoryIndex() } })}
                >
                  <span className="side-menu-item-icon">⌂</span>
                  <span className="side-menu-item-text">
                    <small>{campus?.name}</small>
                    <strong>エリアを選び直す</strong>
                  </span>
                  <span className="side-menu-arrow">›</span>
                </button>



                <button
                  type="button"
                  className="side-menu-item"
                  onClick={() => navigate("/materials")}
                >
                  <span className="side-menu-item-icon">▤</span>

                  <span className="side-menu-item-text">
                    <small>INVENTORY</small>
                    <strong>素材一覧</strong>
                  </span>

                  <span className="side-menu-arrow">›</span>
                </button>

                <button
                  type="button"
                  className="side-menu-item"
                  onClick={() => navigate("/progress/fields")}
                >
                  <span className="side-menu-item-icon">◆</span>

                  <span className="side-menu-item-text">
                    <small>STAMP & STICKER</small>
                    <strong>スタンプ・ステッカー</strong>
                  </span>

                  <span className="side-menu-arrow">›</span>
                </button>

                <button
                  type="button"
                  className="side-menu-item"
                  onClick={() => navigate("/history")}
                >
                  <span className="side-menu-item-icon">◷</span>

                  <span className="side-menu-item-text">
                    <small>ACTIVITY</small>
                    <strong>活動履歴</strong>
                  </span>

                  <span className="side-menu-arrow">›</span>
                </button>

              </div>

              {/* 下部装飾 */}
              <div className="side-menu-footer">
                <span />
                <p>HUNT YOUR QUEST</p>
                <span />
              </div>

            </aside>
          </div>
        )}


        {/* =================================
            コラボロゴ
        ================================= */}
        <div className="home-collaboration">
          <CollaborationLogo />
        </div>

        {qrNotice && (
          <div className="home-qr-notice" role="alert">
            <p>{qrNotice}</p>
            <button
              type="button"
              onClick={() => navigate(location.pathname, { replace: true, state: null })}
            >
              閉じる
            </button>
          </div>
        )}

        <Link to="/qr-scanner" className="home-qr-cta">
          <svg
            className="home-qr-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M3 9V3h6M15 3h6v6M21 15v6h-6M9 21H3v-6" />
            <path d="M7 7h3v3H7zM14 7h3v3h-3zM7 14h3v3H7zM14 14h3v3h-3z" />
          </svg>
          <span className="home-qr-text">
            <strong>QRコードを読み取る</strong>
            <span>会場のQRコードからクエストに挑戦</span>
          </span>
          <span className="home-qr-arrow" aria-hidden="true">›</span>
        </Link>


        {/* =================================
            クエスト一覧
        ================================= */}
        <h2 className="quest-list-title">
          クエスト一覧
        </h2>


        {/* =================================
            クエストカード
        ================================= */}
        <QuestList />

      </div>

      <BottomNavigation active="home" />
    </main>
  );
}

export default Home;

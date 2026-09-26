import { useState } from "react";
import HunterRank from "../../components/Header/HunterRank";
import CollaborationLogo from "../../components/Logo/CollaborationLogo";
import QuestList from "../../components/Quest/QuestBoard/QuestList";
import BottomNavigation from "../../components/Navigation/BottomNavigation";

import "../../components/Header/HunterRank.css";
import "../../components/Logo/CollaborationLogo.css";
import "./Home.css";

function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
            <HunterRank rank={1} />
          </div>

          {/* ハンバーガーメニュー */}
          <button
            type="button"
            className="hamburger-button"
            aria-label="メニュー"
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
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="side-menu-item-icon">?</span>

                  <span className="side-menu-item-text">
                    <small>HELP</small>
                    <strong>ヘルプ</strong>
                  </span>

                  <span className="side-menu-arrow">›</span>
                </button>

                <button
                  type="button"
                  className="side-menu-item"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="side-menu-item-icon">Ⅰ</span>

                  <span className="side-menu-item-text">
                    <small>HOW TO PLAY</small>
                    <strong>ゲーム説明</strong>
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
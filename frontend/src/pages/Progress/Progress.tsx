import { Link } from "react-router-dom";

import PageTitle from "../../components/PageTitle/PageTitle";
import BottomNavigation from "../../components/Navigation/BottomNavigation";
import { useGameTutorial } from "../../components/Tutorial/useGameTutorial";
import { useGame } from "../../context/GameContext";
import { useMapAreas } from "../../context/useMapAreas";
import { getFieldProgress, getStampRallyProgress } from "../../utils/fieldProgress";
import { getWallpaperProgress } from "../../utils/hunterRankReward";
import { MAX_WEAPON_LEVEL } from "../../data/weapons";
import { canUpgradeWeapon } from "../../utils/weaponUpgrade";

import "./Progress.css";

// 進捗のトップ：武器・ステッカー・スマホ壁紙・スタンプの入口を並べる
function Progress() {
  const { zenny, weaponLevel, requiresUpdate, quests, obtainedFieldNoveltyIds, rankExp } = useGame();
  const { active, advance } = useGameTutorial();

  const canUpgrade = !requiresUpdate && canUpgradeWeapon({ weaponLevel, zenny });

  const mapAreas = useMapAreas();
  const fields = mapAreas.map((area) => getFieldProgress(area, quests, obtainedFieldNoveltyIds, mapAreas));
  // 練習中はステッカーをもらえないので、もらえる枚数に数えない
  const redeemableStickers = !active && fields.some((field) => field.redeemable) ? 1 : 0;
  const rally = getStampRallyProgress(mapAreas, quests, obtainedFieldNoveltyIds);
  const stampsEarned = fields.reduce((sum, field) => sum + field.earned, 0);
  const stampsTotal = fields.reduce((sum, field) => sum + field.total, 0);

  const wallpaper = getWallpaperProgress(rankExp);

  const cards = [
    {
      to: "/progress/weapons",
      icon: "⚔",
      title: "武器を強化する",
      status: requiresUpdate && weaponLevel < MAX_WEAPON_LEVEL
        ? "アプリの更新が必要です"
        : canUpgrade
          ? "武器を強化できます"
          : `強化 ${weaponLevel} / ${MAX_WEAPON_LEVEL} 段階`,
      highlight: canUpgrade,
      tutorial: "progress-weapons",
    },
    {
      to: "/progress/stickers",
      icon: "◆",
      title: "ステッカーをもらう",
      status: redeemableStickers > 0
        ? `もらえるステッカーが ${redeemableStickers} 枚あります`
        : rally.redeemed
          ? "ステッカーをもらいました"
          : `集めたスタンプ ${rally.earned} / ${rally.required} 個`,
      highlight: redeemableStickers > 0,
    },
    {
      to: "/progress/wallpaper",
      icon: "★",
      title: "スマホ壁紙をもらう",
      status: wallpaper.reached
        ? `ハンターランク ${wallpaper.requiredRank} に到達しました`
        : `今のハンターランク ${wallpaper.rank} / ${wallpaper.requiredRank}`,
      highlight: false,
    },
    {
      to: "/progress/fields",
      icon: "◎",
      title: "スタンプを集める",
      status: `集めたスタンプ ${stampsEarned} / ${stampsTotal} 個`,
      highlight: false,
    },
  ];

  return (
    <main className="progress-page">
      <div className="progress-content">
        <PageTitle eyebrow="HUNTER PROGRESS" title="進捗" />

        <nav className="progress-hub" aria-label="進捗の項目">
          {cards.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              replace={active}
              className={`progress-hub-card${card.highlight ? " progress-hub-card--highlight" : ""}`}
              data-tutorial={card.tutorial}
              onClick={() => {
                if (active && card.tutorial) advance("weapons-open");
              }}
            >
              <span className="progress-hub-icon" aria-hidden="true">{card.icon}</span>
              <span className="progress-hub-text">
                <strong>{card.title}</strong>
                <small>{card.status}</small>
              </span>
              <span className="progress-hub-arrow" aria-hidden="true">›</span>
            </Link>
          ))}
        </nav>
      </div>

      <BottomNavigation active="progress" />
    </main>
  );
}

export default Progress;

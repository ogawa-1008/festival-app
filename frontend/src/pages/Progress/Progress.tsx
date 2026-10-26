import { Link } from "react-router-dom";

import PageTitle from "../../components/PageTitle/PageTitle";
import BottomNavigation from "../../components/Navigation/BottomNavigation";
import { useGameTutorial } from "../../components/Tutorial/useGameTutorial";
import { useGame } from "../../context/GameContext";
import { useMapAreas } from "../../context/useMapAreas";
import { getFieldProgress } from "../../utils/fieldProgress";
import { getWallpaperProgress } from "../../utils/hunterRankReward";
import { weapons } from "../../data/weapons";
import { hasEnoughWeaponMaterials } from "../../utils/weaponMaterials";

import "./Progress.css";

// 進捗のトップ：武器・ステッカー・スマホ壁紙・スタンプの入口を並べる
function Progress() {
  const { materials, weaponClaimed, requiresUpdate, quests, obtainedFieldNoveltyIds, rankExp } = useGame();
  const { active, advance } = useGameTutorial();

  const canCraft = !weaponClaimed && !requiresUpdate && hasEnoughWeaponMaterials(materials);

  const mapAreas = useMapAreas();
  const fields = mapAreas.map((area) => getFieldProgress(area, quests, obtainedFieldNoveltyIds, mapAreas));
  // 練習中はステッカーをもらえないので、もらえる枚数に数えない
  const redeemableStickers = !active && fields.some((field) => field.redeemable) ? 1 : 0;
  const obtainedStickers = fields.some((field) => field.noveltyObtained) ? 1 : 0;
  const stampsEarned = fields.reduce((sum, field) => sum + field.earned, 0);
  const stampsTotal = fields.reduce((sum, field) => sum + field.total, 0);

  const wallpaper = getWallpaperProgress(rankExp);

  // 作った武器の数（今は武器が1本だけなので、作ったかどうかで数える）
  const craftedWeapons = weaponClaimed ? 1 : 0;

  const cards = [
    {
      to: "/progress/weapons",
      icon: "⚔",
      title: "武器を作る",
      status: requiresUpdate && !weaponClaimed
        ? "アプリの更新が必要です"
        : canCraft
          ? "素材がそろいました。作れます"
          : `作った武器 ${craftedWeapons} / ${weapons.length} 個`,
      highlight: canCraft,
      tutorial: "progress-weapons",
    },
    {
      to: "/progress/stickers",
      icon: "◆",
      title: "ステッカーをもらう",
      status: redeemableStickers > 0
        ? `もらえるステッカーが ${redeemableStickers} 枚あります`
        : `もらったステッカー ${obtainedStickers} / 1 枚（スタンプ3つで交換）`,
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

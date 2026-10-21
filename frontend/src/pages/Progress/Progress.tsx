import { Link } from "react-router-dom";

import PageTitle from "../../components/PageTitle/PageTitle";
import BottomNavigation from "../../components/Navigation/BottomNavigation";
import { useGameTutorial } from "../../components/Tutorial/useGameTutorial";
import { useGame } from "../../context/GameContext";
import { mapAreas } from "../../data/maps";
import { progressData } from "../../data/progress";
import { getFieldProgress } from "../../utils/fieldProgress";
import { getWallpaperProgress } from "../../utils/hunterRankReward";
import { countEnoughWeaponMaterials, hasEnoughWeaponMaterials } from "../../utils/weaponMaterials";

import "./Progress.css";

// 進捗のトップ：武器・ステッカー・スマホ壁紙・スタンプの入口を並べる
function Progress() {
  const { materials, weaponClaimed, requiresUpdate, quests, obtainedFieldNoveltyIds, rankExp } = useGame();
  const { active, advance } = useGameTutorial();

  const enoughMaterials = countEnoughWeaponMaterials(materials);
  const canCraft = !weaponClaimed && !requiresUpdate && hasEnoughWeaponMaterials(materials);

  const fields = mapAreas.map((area) => getFieldProgress(area, quests, obtainedFieldNoveltyIds));
  // 練習中はステッカーをもらえないので、もらえる枚数に数えない
  const redeemableStickers = active
    ? 0
    : fields.filter((field) => field.redeemable && !field.noveltyObtained).length;
  const obtainedStickers = fields.filter((field) => field.noveltyObtained).length;
  const availableFields = fields.filter((field) => field.available).length;
  const stampsEarned = fields.reduce((sum, field) => sum + field.earned, 0);
  const stampsTotal = fields.reduce((sum, field) => sum + field.total, 0);

  const wallpaper = getWallpaperProgress(rankExp);

  const allMaterials = progressData.materials.length;

  const cards = [
    {
      to: "/progress/weapons",
      icon: "⚔",
      title: "武器を作る",
      status: weaponClaimed
        ? "作成済み"
        : requiresUpdate
          ? "アプリの更新が必要です"
          : canCraft
          ? "素材がそろいました。作れます"
          : `そろった素材 ${enoughMaterials} / ${allMaterials} 種類`,
      highlight: canCraft,
      tutorial: "progress-weapons",
    },
    {
      to: "/progress/stickers",
      icon: "◆",
      title: "ステッカーをもらう",
      status: redeemableStickers > 0
        ? `もらえるステッカーが ${redeemableStickers} 枚あります`
        : `もらったステッカー ${obtainedStickers} / ${availableFields} 枚`,
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

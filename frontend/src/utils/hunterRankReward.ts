import { getRankProgress, getTotalExpForRank } from "./hunterRank.ts";

// ハンターランクの報酬（スマホ壁紙）を受け取れるランク
export const WALLPAPER_REQUIRED_RANK = 3;

// 壁紙を受け取れるランクまでの進み具合
export function getWallpaperProgress(totalExp: number) {
  const { rank, rankExp } = getRankProgress(totalExp);
  const requiredExp = getTotalExpForRank(WALLPAPER_REQUIRED_RANK);
  const reached = rank >= WALLPAPER_REQUIRED_RANK;

  return {
    rank,
    requiredRank: WALLPAPER_REQUIRED_RANK,
    reached,
    remainingExp: Math.max(0, requiredExp - rankExp),
    percent: reached ? 100 : Math.floor((rankExp / requiredExp) * 100),
  };
}

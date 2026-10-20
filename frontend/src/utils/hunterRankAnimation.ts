import { getBattleRankReward, getRankProgress, getTotalExpForRank } from "./hunterRank.ts";

const FILL_DURATION_MS = 650;
const COLOR_SETTLE_MS = 350;
const RANK_UP_HOLD_MS = 200;

// 演出は表示値だけを変える。保存するEXPは報酬受取時に更新する。
export function getExpAnimationFrame(fromExp: number, gainedExp: number, elapsedMs: number) {
  const before = getRankProgress(fromExp);
  const after = getBattleRankReward(before.rankExp, gainedExp);
  let cursor = before.rankExp;
  let elapsed = Math.max(0, elapsedMs);

  while (cursor < after.rankExp) {
    const progress = getRankProgress(cursor);
    const boundary = getTotalExpForRank(progress.rank + 1);
    const end = Math.min(boundary, after.rankExp);
    const reachesNextRank = end === boundary;
    const duration = FILL_DURATION_MS + COLOR_SETTLE_MS + (reachesNextRank ? RANK_UP_HOLD_MS : 0);

    if (elapsed < duration) {
      const fraction = Math.min(1, elapsed / FILL_DURATION_MS);
      const eased = 1 - (1 - fraction) ** 3;
      const addedInStage = Math.floor((end - cursor) * eased);
      const progressExp = progress.progressExp + addedInStage;
      const progressPercent = progressExp / progress.requiredExp * 100;
      const settle = Math.max(0, Math.min(1, (elapsed - FILL_DURATION_MS) / COLOR_SETTLE_MS));
      return {
        ...progress,
        rankExp: cursor + addedInStage,
        progressExp,
        progressPercent,
        baseProgressPercent: progress.progressPercent,
        goldProgressPercent: elapsed >= FILL_DURATION_MS ? progressPercent : progress.progressPercent,
        addedOpacity: 1 - settle * settle * (3 - 2 * settle),
        addedExp: cursor - before.rankExp + addedInStage,
        isAnimating: true,
      };
    }

    elapsed -= duration;
    cursor = end;
  }

  return {
    ...after,
    baseProgressPercent: after.progressPercent,
    goldProgressPercent: after.progressPercent,
    addedOpacity: 0,
    addedExp: after.rankExp - before.rankExp,
    isAnimating: false,
  };
}

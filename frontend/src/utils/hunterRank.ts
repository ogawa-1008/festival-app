export const BASE_RANK_EXP = 100;
export const RANK_EXP_INCREMENT = 20;
export const MAX_EXP_PER_RANK = 500;
export const MAX_RANK = 100;
export const RANK_PROGRESS_VERSION = 3;

export type BattleOutcome = "victory" | "failure";

export type RankState = {
  rank: number;
  rankExp: number;
  rankProgressVersion: number;
};

function isValidExp(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

export function getRequiredRankExp(rank: number): number {
  return rank >= MAX_RANK ? 0 : Math.min(BASE_RANK_EXP + rank * RANK_EXP_INCREMENT, MAX_EXP_PER_RANK);
}

export function getTotalExpForRank(rank: number): number {
  const cappedRank = Math.max(0, Math.min(rank, MAX_RANK));
  const growingRanks = Math.min(cappedRank, Math.ceil((MAX_EXP_PER_RANK - BASE_RANK_EXP) / RANK_EXP_INCREMENT));
  return BASE_RANK_EXP * growingRanks
    + RANK_EXP_INCREMENT * growingRanks * (growingRanks - 1) / 2
    + (cappedRank - growingRanks) * MAX_EXP_PER_RANK;
}

export const MAX_RANK_EXP = getTotalExpForRank(MAX_RANK);

export function getRankProgress(totalExp: number) {
  const rankExp = isValidExp(totalExp) ? Math.min(totalExp, MAX_RANK_EXP) : 0;
  let rank = 0;
  while (rank < MAX_RANK && rankExp >= getTotalExpForRank(rank + 1)) {
    rank += 1;
  }
  const isMax = rank === MAX_RANK;
  const requiredExp = getRequiredRankExp(rank);
  const progressExp = isMax ? 0 : rankExp - getTotalExpForRank(rank);
  const progressPercent = isMax ? 100 : Math.round(progressExp / requiredExp * 10000) / 100;

  return {
    rank,
    rankExp,
    progressExp,
    requiredExp,
    progressPercent,
    isMax,
    rankProgressVersion: RANK_PROGRESS_VERSION,
  };
}

export function restoreRankState(saved: Record<string, unknown>): RankState {
  let totalExp = 0;
  if (saved.rankProgressVersion === RANK_PROGRESS_VERSION) {
    totalExp = isValidExp(saved.rankExp) ? saved.rankExp : 0;
  } else if (saved.rankProgressVersion === 2 && isValidExp(saved.rankExp)) {
    // Preserve HR and relative progress when the former requirement exceeds 500.
    const oldExp = Math.min(saved.rankExp, 109000);
    let oldRank = 0;
    let oldStart = 0;
    while (oldRank < MAX_RANK && oldExp >= oldStart + BASE_RANK_EXP + oldRank * RANK_EXP_INCREMENT) {
      oldStart += BASE_RANK_EXP + oldRank * RANK_EXP_INCREMENT;
      oldRank += 1;
    }
    const oldRequired = BASE_RANK_EXP + oldRank * RANK_EXP_INCREMENT;
    const remainder = oldExp - oldStart;
    totalExp = getTotalExpForRank(oldRank) + Math.floor(
      remainder * getRequiredRankExp(oldRank) / oldRequired
    );
  } else if (saved.rankProgressVersion === 1 && isValidExp(saved.rankExp)) {
    // Version 1 used 100 EXP per HR. Preserve HR and earned remainder EXP.
    const oldExp = Math.min(saved.rankExp, 10000);
    totalExp = getTotalExpForRank(Math.floor(oldExp / 100)) + oldExp % 100;
  } else if (saved.rankProgressVersion == null && isValidExp(saved.rank) && isValidExp(saved.rankExp)) {
    // The original prototype started at HR1; its saved HR takes precedence.
    totalExp = getTotalExpForRank(Math.min(saved.rank, MAX_RANK)) + saved.rankExp % 100;
  }

  const { rank, rankExp, rankProgressVersion } = getRankProgress(totalExp);
  return { rank, rankExp, rankProgressVersion };
}

// baseExp: クエストの報酬EXP（getRewardExp）。ランク上限で実際に加算された分を gainedExp として返す
export function getBattleRankReward(totalExp: number, baseExp: number) {
  const current = getRankProgress(totalExp);
  // 小数が入ると getRankProgress が 0 扱いにして進行度が消えるため、整数に丸めて加算する
  const next = getRankProgress(current.rankExp + Math.floor(baseExp));

  return { ...next, gainedExp: next.rankExp - current.rankExp };
}

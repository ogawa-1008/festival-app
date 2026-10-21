import test from "node:test";
import assert from "node:assert/strict";
import { getTotalExpForRank } from "../src/utils/hunterRank.ts";
import { getWallpaperProgress, WALLPAPER_REQUIRED_RANK } from "../src/utils/hunterRankReward.ts";

test("wallpaper progress counts EXP up to the required hunter rank", () => {
  const required = getTotalExpForRank(WALLPAPER_REQUIRED_RANK);
  const start = getWallpaperProgress(0);
  assert.equal(start.rank, 0);
  assert.equal(start.reached, false);
  assert.equal(start.remainingExp, required);
  assert.equal(start.percent, 0);

  const half = getWallpaperProgress(Math.floor(required / 2));
  assert.equal(half.reached, false);
  assert.equal(half.percent, 50);

  const reached = getWallpaperProgress(required);
  assert.equal(reached.rank, WALLPAPER_REQUIRED_RANK);
  assert.equal(reached.reached, true);
  assert.equal(reached.remainingExp, 0);
  assert.equal(reached.percent, 100);
});

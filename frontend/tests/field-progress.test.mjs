import test from "node:test";
import assert from "node:assert/strict";
import { practiceQuest } from "../src/data/quests.ts";
import {
  getFieldProgress,
  restoreFieldNoveltyIds,
} from "../src/utils/fieldProgress.ts";
import { loadSavedGame, saveGame } from "../src/utils/gameStorage.ts";
import { RANK_PROGRESS_VERSION } from "../src/utils/hunterRank.ts";

// IDによる進捗の対応と保存データの復元を確認する。
const quests = ["a", "b", "c"].map((id) => ({ ...practiceQuest, id: `quest-${id}`, qrCode: id }));
const area = (id, questIds) => ({
  id,
  buildingName: `${id}号館`,
  areaName: `field-${id}`,
  photoSpotMonster: "monster",
  questIds,
  novelty: { name: "sticker", description: "", redemptionLocation: "", redemptionSpot: "visited" },
});
const mapAreas = [area(1, ["quest-a"]), area(2, ["quest-b"]), area(3, ["quest-c"]), area(4, [])];

test("field stamps follow quest IDs after reordering, while novelty receipts remain independent", () => {
  const progress = quests
    .map((quest, index) => ({
      ...quest,
      completed: index === 0,
      goldCrown: index === 0,
    }))
    .reverse();
  const first = getFieldProgress(mapAreas[0], progress, [], mapAreas);
  assert.equal(first.earned, 1);
  assert.equal(first.complete, true);
  assert.equal(first.quests[0].goldCrown, true);
  assert.equal(
    first.noveltyObtained,
    false,
    "a stamp must not automatically record a physical reward receipt",
  );
  const second = getFieldProgress(mapAreas[1], progress, [2], mapAreas);
  assert.equal(second.earned, 0);
  assert.equal(second.noveltyObtained, true);
  assert.equal(
    getFieldProgress(mapAreas[3], progress, [], mapAreas).complete,
    false,
    "an unconfigured field is never shown as completed",
  );
  assert.equal(getFieldProgress(mapAreas[0], [], [], mapAreas).available, false);
});

test("novelty receipts survive saving; older saves default to unclaimed and invalid field IDs are ignored", () => {
  let raw = null;
  const storage = {
    getItem: () => raw,
    setItem: (_key, value) => {
      raw = value;
    },
  };
  const initial = {
    rank: 0,
    rankExp: 0,
    rankProgressVersion: RANK_PROGRESS_VERSION,
    obtainedFieldNoveltyIds: [],
  };
  saveGame(storage, {
    ...initial,
    obtainedFieldNoveltyIds: [1, 1, 4, 99, "2", null],
  });
  const restored = loadSavedGame(storage, initial);
  assert.deepEqual(
    restoreFieldNoveltyIds(restored.obtainedFieldNoveltyIds, mapAreas),
    [1, 4],
  );
  raw = JSON.stringify({
    rank: 0,
    rankExp: 0,
    rankProgressVersion: RANK_PROGRESS_VERSION,
  });
  assert.deepEqual(loadSavedGame(storage, initial).obtainedFieldNoveltyIds, []);
});

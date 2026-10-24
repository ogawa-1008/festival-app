import test from "node:test";
import assert from "node:assert/strict";
import { campuses, getBuildingName } from "../src/data/campuses.ts";
import { allCampusQuests, getCampusQuests, getMapAreas } from "../src/data/maps.ts";
import { quests } from "../src/data/quests.ts";
import {
  CAMPUS_STORAGE_KEY,
  clearLegacyBuildingSelection,
  clearMigratedLegacyGame,
  GAME_STORAGE_KEY,
  getCampusGameKey,
  getCampusLoadKey,
  readSelectedCampus,
} from "../src/utils/gameStorage.ts";

test("each campus has its own buildings and photo-spot stickers", () => {
  assert.deepEqual(getMapAreas("tokyo").map((area) => area.id), [1, 3, 4, 5, 6, 7]);
  assert.deepEqual(getMapAreas("osaka").map((area) => area.id), [1, 2, 3, 5, 6]);
  assert.deepEqual(getMapAreas("nagoya").map((area) => area.id), [1, 2, 3]);
  assert.deepEqual(getMapAreas(null), []);

  const [osaka1] = getMapAreas("osaka");
  assert.equal(osaka1.buildingName, "心斎橋1号館");
  assert.equal(osaka1.areaName, "瘴気の谷");
  assert.equal(osaka1.photoSpotMonster, "リオレウス");
  assert.equal(osaka1.novelty.name, "リオレウス オリジナルステッカー");
});

test("field names are assigned in building order for every campus", () => {
  const names = ["瘴気の谷", "古代樹の森", "大蟻塚", "陸珊瑚の台地", "龍結晶の地", "渡りの凍て地"];
  for (const campus of campuses) {
    assert.deepEqual(
      getMapAreas(campus.id).map((area) => area.areaName),
      names.slice(0, getMapAreas(campus.id).length),
    );
  }
});

test("quest IDs and QR codes never collide across campuses", () => {
  const ids = quests.map((quest) => quest.id);
  const qrCodes = quests.map((quest) => quest.qrCode);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(qrCodes).size, qrCodes.length);
  for (const campus of campuses) {
    const campusQuestIds = getCampusQuests(campus.id).map((quest) => quest.id);
    assert.deepEqual(
      allCampusQuests.filter((item) => item.campusId === campus.id).map((item) => item.quest.id),
      campusQuestIds,
    );
    for (const area of getMapAreas(campus.id)) {
      assert.equal(area.questIds.length, 1, "each building has exactly one monster");
      const quest = getCampusQuests(campus.id).find((quest) => quest.id === area.questIds[0]);
      assert.ok(quest, "the monster is playable");
      assert.equal(quest.title, `${area.photoSpotMonster}を討伐せよ！`);
      assert.match(quest.description, new RegExp(area.buildingName));
    }
  }
});

const memoryStorage = (entries = {}) => {
  const data = new Map(Object.entries(entries));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
    get length() {
      return data.size;
    },
    key: (index) => [...data.keys()][index] ?? null,
  };
};

test("building names use the area prefix", () => {
  assert.equal(getBuildingName("osaka", 2), "心斎橋2号館");
  assert.equal(getBuildingName("tokyo", 1), "1号館");
});

test("progress is saved per campus and older saves move to the campus they were made in", () => {
  const legacy = memoryStorage({ [GAME_STORAGE_KEY]: JSON.stringify({ campusId: "osaka", rankExp: 120 }) });
  assert.equal(readSelectedCampus(legacy), "osaka");
  assert.equal(getCampusLoadKey(legacy, "osaka"), GAME_STORAGE_KEY, "the old save belongs to osaka");
  assert.equal(getCampusLoadKey(legacy, "tokyo"), getCampusGameKey("tokyo"), "another campus starts fresh");

  legacy.setItem(getCampusGameKey("osaka"), JSON.stringify({ campusId: "osaka", rankExp: 200 }));
  assert.equal(getCampusLoadKey(legacy, "osaka"), getCampusGameKey("osaka"), "once saved per campus, the old save is ignored");

  legacy.setItem(CAMPUS_STORAGE_KEY, "nagoya");
  assert.equal(readSelectedCampus(legacy), "nagoya");
  assert.equal(readSelectedCampus(memoryStorage()), null);
});

test("the old save is removed only after its campus has been saved separately", () => {
  const storage = memoryStorage({ [GAME_STORAGE_KEY]: JSON.stringify({ campusId: "osaka" }) });
  clearMigratedLegacyGame(storage, "osaka");
  assert.notEqual(storage.getItem(GAME_STORAGE_KEY), null, "not migrated yet");
  clearMigratedLegacyGame(storage, "tokyo");
  storage.setItem(getCampusGameKey("tokyo"), "{}");
  clearMigratedLegacyGame(storage, "tokyo");
  assert.notEqual(storage.getItem(GAME_STORAGE_KEY), null, "another campus never removes it");
  storage.setItem(getCampusGameKey("osaka"), "{}");
  clearMigratedLegacyGame(storage, "osaka");
  assert.equal(storage.getItem(GAME_STORAGE_KEY), null);
});

test("old building selections saved before the building screen was removed are cleared", () => {
  const storage = memoryStorage({
    "monster-hunter-festival-building:osaka": "2",
    "monster-hunter-festival-building:tokyo": "1",
    "monster-hunter-festival-building:old-area": "3",
    [CAMPUS_STORAGE_KEY]: "osaka",
  });
  clearLegacyBuildingSelection(storage);
  assert.equal(storage.getItem("monster-hunter-festival-building:old-area"), null, "areas no longer in the list are cleared too");
  assert.equal(storage.getItem("monster-hunter-festival-building:osaka"), null);
  assert.equal(storage.getItem("monster-hunter-festival-building:tokyo"), null);
  assert.equal(storage.getItem(CAMPUS_STORAGE_KEY), "osaka", "the selected area is kept");
});

test("every reward material is defined in the material list, and a building can set its own rewards", async () => {
  const { MATERIALS } = await import("../src/data/materials.ts");
  const { defineFields, DEFAULT_REWARD_MATERIALS } = await import("../src/data/campuses/defineFields.ts");
  for (const quest of quests) {
    for (const reward of quest.rewardMaterials) {
      assert.ok(reward.id in MATERIALS, `${quest.id} uses an undefined material ${reward.id}`);
      assert.ok(reward.amount > 0);
    }
  }
  const [withDefault, withOwn] = defineFields("osaka", [
    { building: 1, areaName: "a", photoSpotMonster: "ジンオウガ" },
    { building: 2, areaName: "b", photoSpotMonster: "リオレウス", rewardMaterials: [{ id: 3, amount: 1 }] },
  ]);
  assert.deepEqual(withDefault.quest.rewardMaterials, DEFAULT_REWARD_MATERIALS);
  assert.deepEqual(withOwn.quest.rewardMaterials, [{ id: 3, amount: 1 }]);
});

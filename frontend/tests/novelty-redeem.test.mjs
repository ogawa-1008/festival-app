import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { getCampusQuests, getMapAreas } from "../src/data/maps.ts";
import { getFieldProgress, getRedeemConditionText } from "../src/utils/fieldProgress.ts";
import { fetchNoveltyStocks, redeemNovelty } from "../src/api/noveltyApi.ts";

const mapAreas = getMapAreas("tokyo");
const quests = getCampusQuests("tokyo");
const progressFor = (area, progress, receipts = []) => getFieldProgress(area, progress, receipts, mapAreas);

test("three different buildings grant one sticker; hunts and investigations each grant one stamp", () => {
  const progress = quests.map((quest, index) => ({
    ...quest,
    completed: index === 0,
    investigated: index === 1,
  }));
  assert.equal(progressFor(mapAreas[0], quests).redeemable, false, "starting a quest is not a stamp");
  assert.equal(progressFor(mapAreas[0], progress).redeemable, false, "two buildings are insufficient");
  assert.equal(progressFor(mapAreas[1], progress).complete, true, "investigation grants a stamp");
  assert.match(getRedeemConditionText(progressFor(mapAreas[0], progress)), /（2 \/ 3）/);

  const third = progress.map((quest, index) => index === 2 ? { ...quest, investigated: true } : quest);
  const completed = progressFor(mapAreas[0], third);
  assert.equal(completed.rally.earned, 3);
  assert.equal(completed.redeemable, true);
  assert.equal(progressFor(mapAreas[2], third).redeemable, true, "a visited building can be chosen");
  assert.equal(progressFor(mapAreas[3], third).redeemable, true, "every building hands out stickers");

  const receipts = [mapAreas[0].id];
  assert.equal(progressFor(mapAreas[0], third, receipts).noveltyObtained, true);
  assert.ok(mapAreas.every((area) => !progressFor(area, third, receipts).redeemable), "only one sticker in total");
  assert.match(getRedeemConditionText(progressFor(mapAreas[1], third, receipts)), /1枚受け取り済み/);
});

test("repeat hunts, practice, and another campus never replace visits to three buildings", () => {
  const hunted = quests.map((quest, index) => ({ ...quest, completed: index === 0, investigated: index === 0 }));
  const extras = getCampusQuests("osaka").map((quest) => ({ ...quest, completed: true }));
  const progress = [...hunted, ...extras, ...Array.from({ length: 3 }, () => hunted[0]), { id: "quest-001", completed: true }];
  assert.equal(progressFor(mapAreas[0], progress).rally.earned, 1);
  assert.equal(progressFor(mapAreas[0], progress).redeemable, false);
  assert.equal(progressFor({ ...mapAreas[0], questIds: [] }, progress).redeemable, false);
  assert.equal(progressFor({ ...mapAreas[0], questIds: quests.slice(0, 3).map((quest) => quest.id) }, progress).available, false,
    "a legacy field with multiple quests cannot count as three buildings");
});

const realFetch = globalThis.fetch;
const mockFetch = (handler) => {
  globalThis.fetch = async (url, init) => handler(String(url), init);
};
// 差し替えた fetch をほかのテストに持ち越さない
afterEach(() => {
  globalThis.fetch = realFetch;
});
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

test("redeem calls the API and returns the remaining stock", async () => {
  let called;
  mockFetch((url, init) => {
    called = { url, method: init?.method };
    return json(200, { campus: "osaka", fieldId: 1, remaining: 499 });
  });
  const result = await redeemNovelty("osaka", 1);
  assert.deepEqual(result, { ok: true, value: { fieldId: 1, remaining: 499 } });
  assert.deepEqual(called, { url: "/api/campuses/osaka/novelties/1/redeem", method: "POST" });
});

test("redeem maps 409, 404, other errors and network failures", async () => {
  for (const [status, error] of [[409, "out-of-stock"], [404, "not-found"], [500, "server"]]) {
    mockFetch(() => json(status, { error: "x" }));
    assert.deepEqual(await redeemNovelty("osaka", 1), { ok: false, error });
  }
  mockFetch(() => { throw new TypeError("Failed to fetch"); });
  assert.deepEqual(await redeemNovelty("osaka", 1), { ok: false, error: "network" });
  mockFetch(() => json(200, { unexpected: true }));
  assert.deepEqual(await redeemNovelty("osaka", 1), { ok: false, error: "server" });
});

test("stock list is parsed per field", async () => {
  mockFetch(() => json(200, { campus: "tokyo", novelties: [{ fieldId: 1, remaining: 3 }, { fieldId: 2, remaining: 0 }] }));
  assert.deepEqual(await fetchNoveltyStocks("tokyo"), { ok: true, value: [{ fieldId: 1, remaining: 3 }, { fieldId: 2, remaining: 0 }] });
});

test("every campus lets you redeem at any building once three stamps are collected", () => {
  const areas = getMapAreas("osaka");
  const osakaQuests = getCampusQuests("osaka");
  const three = osakaQuests.map((quest, index) => ({ ...quest, completed: index < 3 }));
  const redeemable = areas.filter((area) => getFieldProgress(area, three, [], areas).redeemable).map((area) => area.id);
  assert.deepEqual(redeemable, [1, 2, 3, 5, 6]);
  assert.ok(areas.every((area) => !getFieldProgress(area, three, [5], areas).redeemable), "only one sticker in total");
});

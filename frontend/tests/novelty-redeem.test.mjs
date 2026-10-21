import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { practiceQuest } from "../src/data/quests.ts";
import { getFieldProgress } from "../src/utils/fieldProgress.ts";
import { fetchNoveltyStocks, redeemNovelty } from "../src/api/noveltyApi.ts";

// 実際の校舎のデータ（モンスターが未定）に左右されないよう、テスト用のフィールドとクエストを使う
const quests = [{ ...practiceQuest, id: "quest-a" }, { ...practiceQuest, id: "quest-b" }];
const area = (id, questIds) => ({
  id,
  buildingName: `${id}号館`,
  areaName: `field-${id}`,
  photoSpotMonster: "monster",
  questIds,
  novelty: { name: "sticker", description: "", redemptionLocation: "" },
});
const mapAreas = [area(1, ["quest-a"]), area(2, [])];
const field = mapAreas.find((area) => area.questIds.length > 0);
const questOf = (id, patch) => quests.map((quest) => (quest.id === id ? { ...quest, ...patch } : quest));

test("a sticker can be redeemed after every quest in the field is hunted or investigated", () => {
  const none = getFieldProgress(field, quests, []);
  assert.equal(none.redeemable, false);
  assert.equal(none.attempted, 0);

  const investigated = getFieldProgress(field, questOf(field.questIds[0], { investigated: true }), []);
  assert.equal(investigated.redeemable, true, "investigation (failure) also counts");
  assert.equal(investigated.complete, false, "investigation does not grant the stamp");

  const hunted = getFieldProgress(field, questOf(field.questIds[0], { completed: true }), []);
  assert.equal(hunted.redeemable, true);
});

test("a field without quests can never be redeemed", () => {
  const empty = mapAreas.find((area) => area.questIds.length === 0);
  const all = quests.map((quest) => ({ ...quest, completed: true, investigated: true }));
  assert.equal(getFieldProgress(empty, all, []).redeemable, false);
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

test("the condition text shows attempted / total, or that the field is not ready", async () => {
  const { getRedeemConditionText } = await import("../src/utils/fieldProgress.ts");
  assert.match(getRedeemConditionText({ available: true, attempted: 1, total: 2 }), /（1 \/ 2）/);
  assert.equal(getRedeemConditionText({ available: false, attempted: 0, total: 0 }), "このフィールドのクエストは準備中です。");
});

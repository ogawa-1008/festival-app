import test from "node:test";
import assert from "node:assert/strict";
import {
  VISITOR_ID_KEY,
  VISIT_SENT_DATE_KEY,
  createVisitorId,
  toJstDate,
  trackVisit,
} from "../src/utils/visitTracker.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const ID_A = "11111111-1111-4111-8111-111111111111";
const ID_B = "22222222-2222-4222-8222-222222222222";

const memoryStorage = (initial = {}) => {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
  };
};

const recorder = (ok = true) => {
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({ url, method: init.method, body: JSON.parse(init.body) });
    return { ok };
  };
  return { calls, fetcher };
};

// 2026-11-14 10:00（日本時間）
const festivalMorning = new Date("2026-11-14T01:00:00Z");

test("dates follow Japan time, not the device clock", () => {
  assert.equal(toJstDate(new Date("2026-11-13T14:59:59Z")), "2026-11-13");
  assert.equal(toJstDate(new Date("2026-11-13T15:00:00Z")), "2026-11-14", "midnight in Japan is a new day");
});

test("visitor IDs are UUID v4, even without randomUUID (plain http on a phone)", () => {
  assert.match(createVisitorId(), UUID);
  const fallback = createVisitorId({ getRandomValues: (array) => array.fill(0xff) });
  assert.match(fallback, UUID);
});

test("the first open of the day sends the device ID once", async () => {
  const storage = memoryStorage();
  const { calls, fetcher } = recorder();

  assert.equal(await trackVisit({ storage, fetcher, now: festivalMorning, createId: () => ID_A }), "sent");
  assert.deepEqual(calls, [{ url: "/api/visits", method: "POST", body: { visitorId: ID_A } }]);
  assert.equal(storage.getItem(VISITOR_ID_KEY), ID_A);
  assert.equal(storage.getItem(VISIT_SENT_DATE_KEY), "2026-11-14");

  assert.equal(await trackVisit({ storage, fetcher, now: festivalMorning, createId: () => ID_B }), "skipped");
  assert.equal(calls.length, 1, "reopening on the same day sends nothing");
});

test("the same device keeps its ID on another day (a test visit before the festival)", async () => {
  const storage = memoryStorage({ [VISITOR_ID_KEY]: ID_A, [VISIT_SENT_DATE_KEY]: "2026-11-12" });
  const { calls, fetcher } = recorder();

  assert.equal(await trackVisit({ storage, fetcher, now: festivalMorning, createId: () => ID_B }), "sent");
  assert.deepEqual(calls[0].body, { visitorId: ID_A });
});

test("a failed send is retried on the next open", async () => {
  const storage = memoryStorage();
  const failing = recorder(false);
  assert.equal(await trackVisit({ storage, fetcher: failing.fetcher, now: festivalMorning, createId: () => ID_A }), "failed");
  assert.equal(storage.getItem(VISIT_SENT_DATE_KEY), null);

  const offline = async () => { throw new TypeError("Failed to fetch"); };
  assert.equal(await trackVisit({ storage, fetcher: offline, now: festivalMorning }), "failed");

  const working = recorder();
  assert.equal(await trackVisit({ storage, fetcher: working.fetcher, now: festivalMorning, createId: () => ID_B }), "sent");
  assert.deepEqual(working.calls[0].body, { visitorId: ID_A }, "the ID made on the first try is reused");
});

test("nothing is sent when the device cannot keep the ID (it would count every open)", async () => {
  const { calls, fetcher } = recorder();
  const blocked = { getItem: () => { throw new Error("SecurityError"); }, setItem: () => { throw new Error("SecurityError"); } };
  assert.equal(await trackVisit({ storage: blocked, fetcher, now: festivalMorning }), "skipped");

  // localStorage を見るだけで例外になるブラウザ（既定の localStorage を使うとき）
  const realWindow = globalThis.window;
  globalThis.window = { get localStorage() { throw new Error("SecurityError"); } };
  try {
    assert.equal(await trackVisit({ fetcher, now: festivalMorning }), "skipped");
  } finally {
    globalThis.window = realWindow;
  }

  const forgetful = { getItem: () => null, setItem: () => {} };
  assert.equal(await trackVisit({ storage: forgetful, fetcher, now: festivalMorning, createId: () => ID_A }), "skipped");
  assert.equal(calls.length, 0);
});

test("a broken saved ID is replaced with a new one", async () => {
  const storage = memoryStorage({ [VISITOR_ID_KEY]: "not-a-uuid" });
  const { calls, fetcher } = recorder();
  await trackVisit({ storage, fetcher, now: festivalMorning, createId: () => ID_B });
  assert.deepEqual(calls[0].body, { visitorId: ID_B });
  assert.equal(storage.getItem(VISITOR_ID_KEY), ID_B);
});

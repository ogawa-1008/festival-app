import test from "node:test";
import assert from "node:assert/strict";
import { buildQuestQrUrl, parseQuestQr, toQuestCode } from "../src/utils/questQr.ts";

test("the quest code is read from a URL on any domain and from the old plain code", () => {
  assert.equal(parseQuestQr("https://festival.example.com/q/QUEST_OSAKA_1"), "QUEST_OSAKA_1");
  assert.equal(parseQuestQr("http://localhost:5173/q/QUEST_TOKYO_7/"), "QUEST_TOKYO_7");
  assert.equal(parseQuestQr("https://preview-abc.vercel.app/q/QUEST_NAGOYA_2?utm=x#top"), "QUEST_NAGOYA_2");
  assert.equal(parseQuestQr("  QUEST_OSAKA_3  "), "QUEST_OSAKA_3");
  assert.equal(parseQuestQr("QUEST_001"), "QUEST_001");
});

test("URLs that are not quest QR codes give no code", () => {
  assert.equal(parseQuestQr("https://example.com/"), null);
  assert.equal(parseQuestQr("https://example.com/map"), null);
  assert.equal(parseQuestQr("https://example.com/q/"), null);
  assert.equal(parseQuestQr("こんにちは"), null);
  assert.equal(parseQuestQr(""), null);
});

test("a QR URL is built from the app URL and the quest code", () => {
  assert.equal(buildQuestQrUrl("https://festival.example.com/", "QUEST_OSAKA_1"), "https://festival.example.com/q/QUEST_OSAKA_1");
  assert.equal(parseQuestQr(buildQuestQrUrl("https://a.example", "QUEST_TOKYO_1")), "QUEST_TOKYO_1");
});

test("the already-decoded /q/:code param is only validated, not decoded again", () => {
  assert.equal(toQuestCode("QUEST_OSAKA_1"), "QUEST_OSAKA_1");
  assert.equal(toQuestCode("QUEST%41"), null);
  assert.equal(toQuestCode(""), null);
});

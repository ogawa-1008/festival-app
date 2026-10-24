import test from "node:test";
import assert from "node:assert/strict";
import {
  END_MESSAGES,
  getBattleMessage,
  getShownRoundResult,
  RESUME_MESSAGE,
  START_MESSAGE,
} from "../src/pages/Battle/battleMessage.ts";

const round = (result, damage) => ({ playerHand: "rock", enemyHand: "scissors", result, damage });
const session = (patch) => ({ lastRound: null, endReason: null, turnsLeft: 30, maxTurns: 30, ...patch });

test("before the first hand shows the start message, and an older session resumed mid-battle shows the resume message", () => {
  assert.deepEqual(getBattleMessage(session({})), { text: START_MESSAGE, sub: null });
  assert.deepEqual(getBattleMessage(session({ turnsLeft: 20 })), { text: RESUME_MESSAGE, sub: null });
});

test("during the battle the damage of the last hand is the main text", () => {
  assert.equal(getBattleMessage(session({ lastRound: round("player", 30) })).text, "モンスターに30ダメージ！");
  assert.equal(getBattleMessage(session({ lastRound: round("enemy", 12) })).text, "12ダメージを受けた！");
  assert.equal(getBattleMessage(session({ lastRound: round("draw") })).text, "HPは変わりません");
  // 以前の形式のセッション（ダメージの記録なし）
  assert.equal(getBattleMessage(session({ lastRound: round("player") })).text, "モンスターにダメージ！");
});

test("when the battle ends, the end message is the main text and the last hand's damage is added", () => {
  assert.deepEqual(
    getBattleMessage(session({ endReason: "victory", lastRound: round("player", 12) })),
    { text: END_MESSAGES.victory, sub: "モンスターに12ダメージ！" },
  );
  assert.deepEqual(
    getBattleMessage(session({ endReason: "defeated", lastRound: round("enemy", 14) })),
    { text: END_MESSAGES.defeated, sub: "14ダメージを受けた！" },
  );
  assert.deepEqual(
    getBattleMessage(session({ endReason: "timeout", lastRound: round("player", 30) })),
    { text: END_MESSAGES.timeout, sub: "最後の手：勝ち！ モンスターに30ダメージ！" },
  );
  assert.deepEqual(getBattleMessage(session({ endReason: "timeout" })), { text: END_MESSAGES.timeout, sub: null });
});

test("when hands run out, the last result is not shown large (it would contradict the failure)", () => {
  assert.equal(getShownRoundResult({ endReason: "timeout", lastRound: round("player", 30) }), undefined);
  assert.equal(getShownRoundResult({ endReason: "victory", lastRound: round("player", 30) }), "player");
  assert.equal(getShownRoundResult({ endReason: null, lastRound: round("enemy", 10) }), "enemy");
});

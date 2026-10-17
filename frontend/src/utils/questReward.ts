import { DEFAULT_REWARD_EXP, type Quest } from "../types/quest";

// 調査（失敗）のときは討伐時のEXPの3割（切り上げ）
const FAILURE_EXP_RATE = 0.3;

export function getRewardExp(
  quest: Pick<Quest, "rewardExp">,
  outcome: "victory" | "failure"
) {
  const exp = quest.rewardExp ?? DEFAULT_REWARD_EXP;

  return outcome === "victory" ? exp : Math.ceil(exp * FAILURE_EXP_RATE);
}

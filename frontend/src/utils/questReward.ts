import { quests } from "../data/quests";
import { DEFAULT_REWARD_EXP } from "../types/quest";

// 調査（失敗）のときは討伐時のEXPの3割（切り上げ）
const FAILURE_EXP_RATE = 0.3;

// 報酬EXPは保存済みの進行度ではなく、クエストの定義（data/quests.ts）から読む
// （保存済みのクエストには後から追加した rewardExp が無いため）
export function getRewardExp(questId: string, outcome: "victory" | "failure") {
  const exp =
    quests.find((quest) => quest.id === questId)?.rewardExp ?? DEFAULT_REWARD_EXP;

  return outcome === "victory" ? exp : Math.ceil(exp * FAILURE_EXP_RATE);
}

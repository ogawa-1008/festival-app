import {
  DEFAULT_MAX_TURNS,
  DEFAULT_MONSTER_ATTACK,
  DEFAULT_MONSTER_HP,
  type Quest,
} from "../types/quest";
import type { BattleStats } from "./battleSession";
import { getPlayerStats } from "./playerStats";

// クエストの定義と交換済みの武器から、バトル開始時のステータスを決める
export function getBattleStats(
  quest: Pick<Quest, "maxTurns" | "monsterHp" | "monsterAttack">,
  state: { weaponClaimed: boolean }
): BattleStats {
  const player = getPlayerStats(state);

  return {
    maxTurns: quest.maxTurns ?? DEFAULT_MAX_TURNS,
    playerMaxHp: player.maxHp,
    playerAttack: player.attack,
    monsterMaxHp: quest.monsterHp ?? DEFAULT_MONSTER_HP,
    monsterAttack: quest.monsterAttack ?? DEFAULT_MONSTER_ATTACK,
  };
}

import { DEFAULT_MAX_TURNS, DEFAULT_MONSTER_ATTACK, DEFAULT_MONSTER_HP, type Quest } from "../types/quest.ts";
import type { BattleStats } from "./battleSession.ts";
import { getPlayerStats, PLAYER_BASE_ATTACK } from "./playerStats.ts";
import { getBattleBalance } from "../game/battle.ts";

// Snapshot current quest configuration and weapon bonuses at scan time.
export function getBattleStats(
  quest: Pick<Quest, "id" | "maxTurns" | "monsterHp" | "monsterAttack" | "monsterAttackMin" | "monsterAttackMax">,
  state: { weaponClaimed: boolean }
): BattleStats {
  const player = getPlayerStats(state);
  const balance = getBattleBalance(quest.id);
  const weaponBonus = player.attack - PLAYER_BASE_ATTACK;
  return {
    maxTurns: quest.maxTurns ?? DEFAULT_MAX_TURNS,
    playerMaxHp: player.maxHp,
    playerAttack: player.attack,
    playerDamageMin: balance.playerDamage.min + weaponBonus,
    playerDamageMax: balance.playerDamage.max + weaponBonus,
    monsterMaxHp: quest.monsterHp ?? DEFAULT_MONSTER_HP,
    monsterAttack: quest.monsterAttack ?? DEFAULT_MONSTER_ATTACK,
    monsterDamageMin: quest.monsterAttackMin ?? quest.monsterAttack ?? DEFAULT_MONSTER_ATTACK,
    monsterDamageMax: quest.monsterAttackMax ?? quest.monsterAttack ?? DEFAULT_MONSTER_ATTACK,
  };
}

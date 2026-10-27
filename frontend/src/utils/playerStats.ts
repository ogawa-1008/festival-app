import { hunterMaxHp, getBattleBalance } from "../game/battle.ts";
import type { Weapon } from "../data/weapons.ts";
import { getCurrentWeapon } from "./weaponUpgrade.ts";

// バトル開始時のプレイヤーの最大HP
export const PLAYER_MAX_HP = hunterMaxHp;

// 初期の武器（ボーンスラッシャー）の攻撃力（勝ったときモンスターに与えるダメージ）
export const PLAYER_BASE_ATTACK = Math.floor((getBattleBalance("quest-001").playerDamage.min + getBattleBalance("quest-001").playerDamage.max) / 2);

export type PlayerStats = {
  maxHp: number;
  attack: number;
};

// その武器を持ったときの攻撃力
export function getWeaponAttack(weapon: Weapon): number {
  return PLAYER_BASE_ATTACK + weapon.attackBonus;
}

// 強化した武器の分だけ攻撃力を上げる
export function getPlayerStats(state: { weaponLevel: number }): PlayerStats {
  return {
    maxHp: PLAYER_MAX_HP,
    attack: getWeaponAttack(getCurrentWeapon(state.weaponLevel)),
  };
}

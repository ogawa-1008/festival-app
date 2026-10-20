import { hunterMaxHp, getBattleBalance } from "../game/battle.ts";
import { AGITO_WEAPON_ID, weapons } from "../data/weapons.ts";

// バトル開始時のプレイヤーの最大HP
export const PLAYER_MAX_HP = hunterMaxHp;

// 武器なしの攻撃力（勝ったときモンスターに与えるダメージ）
export const PLAYER_BASE_ATTACK = Math.floor((getBattleBalance("quest-001").playerDamage.min + getBattleBalance("quest-001").playerDamage.max) / 2);

export type PlayerStats = {
  maxHp: number;
  attack: number;
};

// 交換済みの武器ID。今は武器が1本だけなので weaponClaimed から求める
// （武器を増やすときは、交換済みの武器を GameState に一覧で記録する形にする）
function getClaimedWeaponIds(state: { weaponClaimed: boolean }) {
  return state.weaponClaimed ? [AGITO_WEAPON_ID] : [];
}

export function getPlayerStats(state: { weaponClaimed: boolean }): PlayerStats {
  const claimed = getClaimedWeaponIds(state);
  const attackBonus = weapons
    .filter((weapon) => claimed.includes(weapon.id))
    .reduce((sum, weapon) => sum + weapon.attackBonus, 0);

  return {
    maxHp: PLAYER_MAX_HP,
    attack: PLAYER_BASE_ATTACK + attackBonus,
  };
}

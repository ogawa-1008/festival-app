import assert from "node:assert/strict";
import { test } from "node:test";

import { MAX_WEAPON_LEVEL, REWARD_ZENNY, WEAPONS } from "../src/data/weapons.ts";
import { getPlayerStats, PLAYER_BASE_ATTACK } from "../src/utils/playerStats.ts";
import {
  canUpgradeWeapon,
  formatZenny,
  getCurrentWeapon,
  getNextWeapon,
  getRewardZenny,
  normalizeWeaponLevel,
  normalizeZenny,
  upgradeWeapon,
} from "../src/utils/weaponUpgrade.ts";

test("the weapon goes Bone Slasher → II → III → Oo-Agito, starting from the free Bone Slasher", () => {
  assert.deepEqual(WEAPONS.map((weapon) => weapon.name), ["ボーンスラッシャー", "ボーンスラッシャーⅡ", "ボーンスラッシャーⅢ", "オオアギト"]);
  assert.equal(MAX_WEAPON_LEVEL, 3);
  assert.equal(getCurrentWeapon(0).upgradeCost, 0);
  assert.equal(getCurrentWeapon(0).attackBonus, 0);
  assert.equal(getNextWeapon(MAX_WEAPON_LEVEL), null);
});

test("upgrading spends the next stage's cost and only works with enough zenny", () => {
  const cost = getNextWeapon(0).upgradeCost;
  assert.equal(canUpgradeWeapon({ weaponLevel: 0, zenny: cost - 1 }), false);
  assert.equal(upgradeWeapon({ weaponLevel: 0, zenny: cost - 1 }), null);
  assert.equal(canUpgradeWeapon({ weaponLevel: 0, zenny: cost }), true);
  assert.deepEqual(upgradeWeapon({ weaponLevel: 0, zenny: cost + 300 }), { weaponLevel: 1, zenny: 300 });
  assert.equal(upgradeWeapon({ weaponLevel: MAX_WEAPON_LEVEL, zenny: 999999 }), null);
});

test("the attack rises with each stage, most at the final one", () => {
  const bonuses = WEAPONS.map((_, level) => getPlayerStats({ weaponLevel: level }).attack - PLAYER_BASE_ATTACK);
  assert.deepEqual(bonuses, [0, 1, 2, 4]);
});

test("a hunt gives full zenny and an investigation gives half", () => {
  assert.equal(getRewardZenny("victory"), REWARD_ZENNY.victory);
  assert.equal(getRewardZenny("failure"), REWARD_ZENNY.failure);
  assert.equal(formatZenny(1000), "1,000z");
});

test("broken or old save values fall back to the first weapon and 0z", () => {
  assert.equal(normalizeWeaponLevel(undefined), 0);
  assert.equal(normalizeWeaponLevel(-2), 0);
  assert.equal(normalizeWeaponLevel(99), MAX_WEAPON_LEVEL);
  assert.equal(normalizeWeaponLevel(1.7), 1);
  assert.equal(normalizeZenny("500"), 0);
  assert.equal(normalizeZenny(-10), 0);
  assert.equal(normalizeZenny(1500.5), 1500);
});

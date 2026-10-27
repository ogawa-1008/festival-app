import { MAX_WEAPON_LEVEL, REWARD_ZENNY, WEAPONS } from "../data/weapons.ts";

export type WeaponState = {
  weaponLevel: number;
  zenny: number;
};

// 保存データの強化段階を、0〜最後の段階の整数にそろえる（古いデータや壊れた値でも落ちないように）
export function normalizeWeaponLevel(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(MAX_WEAPON_LEVEL, Math.max(0, Math.floor(value)))
    : 0;
}

// 保存データの所持ゼニーを、0以上の整数にそろえる
export function normalizeZenny(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

// 今の武器
export function getCurrentWeapon(weaponLevel: number) {
  return WEAPONS[normalizeWeaponLevel(weaponLevel)];
}

// 次に強化できる武器。最後の段階なら null
export function getNextWeapon(weaponLevel: number) {
  const level = normalizeWeaponLevel(weaponLevel);
  return level < MAX_WEAPON_LEVEL ? WEAPONS[level + 1] : null;
}

// 次の段階へ強化できるだけのゼニーがあるか
export function canUpgradeWeapon({ weaponLevel, zenny }: WeaponState) {
  const next = getNextWeapon(weaponLevel);
  return next !== null && zenny >= next.upgradeCost;
}

// 強化したあとの状態。強化できなければ null
export function upgradeWeapon(state: WeaponState): WeaponState | null {
  const next = getNextWeapon(state.weaponLevel);
  if (!next || state.zenny < next.upgradeCost) return null;

  return {
    weaponLevel: normalizeWeaponLevel(state.weaponLevel) + 1,
    zenny: state.zenny - next.upgradeCost,
  };
}

// クエストでもらえるゼニー（討伐・調査）
export function getRewardZenny(outcome: "victory" | "failure") {
  return REWARD_ZENNY[outcome];
}

// 「1,000z」の形で表示する
export function formatZenny(zenny: number) {
  return `${zenny.toLocaleString("ja-JP")}z`;
}

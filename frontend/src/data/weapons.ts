// 武器の強化とゼニーの額。正式な額・攻撃力が決まったら、このファイルだけを書き換える

export type Weapon = {
  name: string;
  image: string;
  // ボーンスラッシャー（初期の武器）と比べて上がる攻撃力（勝ったときモンスターに与えるダメージに足す）
  attackBonus: number;
  // 1つ前の段階からこの武器に強化するのに使うゼニー（初期の武器は 0）
  upgradeCost: number;
};

// 正式な画像が届くまでの仮の画像
const PLACEHOLDER_IMAGE = "/images/progress/C3B5F225-6372-4037-9418-BF36AB832A34_4_5005_c.jpeg";

// 強化の段階の順に並べる。0 番目はエリアを選んだときに全員に配る武器。
// 保存データには何番目まで強化したか（weaponLevel）を記録するので、並びを変えないこと
export const WEAPONS: Weapon[] = [
  { name: "ボーンスラッシャー", image: PLACEHOLDER_IMAGE, attackBonus: 0, upgradeCost: 0 },
  { name: "ボーンスラッシャーⅡ", image: PLACEHOLDER_IMAGE, attackBonus: 1, upgradeCost: 1000 },
  { name: "ボーンスラッシャーⅢ", image: PLACEHOLDER_IMAGE, attackBonus: 2, upgradeCost: 2000 },
  { name: "オオアギト", image: PLACEHOLDER_IMAGE, attackBonus: 4, upgradeCost: 3000 },
];

// 最後の段階（これ以上強化できない）
export const MAX_WEAPON_LEVEL = WEAPONS.length - 1;

// クエストでもらえるゼニー（討伐・調査）
export const REWARD_ZENNY = {
  victory: 1000,
  failure: 500,
};

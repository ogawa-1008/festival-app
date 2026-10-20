export type Weapon = {
  id: string;
  name: string;
  // 交換するとプレイヤーの攻撃力に加算される値（交換した武器の分だけ積み上がる）
  attackBonus: number;
};

// 交換ページで交換できる武器（今は1本だけ）
export const AGITO_WEAPON_ID = "agito";

export const weapons: Weapon[] = [
  {
    id: AGITO_WEAPON_ID,
    name: "アギト",
    attackBonus: 1,
  },
];

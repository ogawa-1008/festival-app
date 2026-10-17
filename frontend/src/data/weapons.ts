export type Weapon = {
  id: string;
  name: string;
  // 交換するとプレイヤーの攻撃力に加算される値（交換した武器の分だけ積み上がる）
  attackBonus: number;
};

export const weapons: Weapon[] = [
  {
    id: "agito",
    name: "アギト",
    attackBonus: 1,
  },
];

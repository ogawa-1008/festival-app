// クエストの定義で未設定の項目に使う既定値
export const DEFAULT_MAX_TURNS = 30;
export const DEFAULT_MONSTER_HP = 120;
export const DEFAULT_MONSTER_ATTACK = 12;
export const DEFAULT_REWARD_EXP = 100;

export type Quest = {
  id: string;
  title: string;
  description: string;

  image: string;

  qrCode: string;

  // 討伐時にドロップする素材（調査＝失敗時は半分・切り上げ）
  rewardMaterials: {
    id: number;
    amount: number;
  }[];

  // 討伐時にもらえるHR EXP（調査＝失敗時は3割・切り上げ）
  rewardExp?: number;

  // バトルで出せる手の最大回数（あいこも1回に数える）
  maxTurns?: number;

  // モンスターのHP
  monsterHp?: number;

  // モンスターの攻撃力（負けたときプレイヤーが受けるダメージ）
  monsterAttack?: number;
  monsterAttackMin?: number;
  monsterAttackMax?: number;

  completed: boolean;
  goldCrown?: boolean;
  // 調査（失敗）の報酬を受け取ったか（ステッカーの交換条件「討伐または調査」に使う）
  investigated?: boolean;
};

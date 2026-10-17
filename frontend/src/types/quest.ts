// 未設定のクエスト（保存済みデータ含む）で使う既定値
export const DEFAULT_MAX_TURNS = 5;
export const DEFAULT_MONSTER_HP = 3;
export const DEFAULT_MONSTER_ATTACK = 3;
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

  completed: boolean;
  goldCrown?: boolean;
};

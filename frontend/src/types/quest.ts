// maxTurns 未設定のクエスト（保存済みデータ含む）で使う既定値
export const DEFAULT_MAX_TURNS = 5;

export type Quest = {
  id: string;
  title: string;
  description: string;

  image: string;

  qrCode: string;

  rewardMaterials: {
    id: number;
    amount: number;
  }[];

  // バトルで出せる手の最大回数（あいこも1回に数える）
  maxTurns?: number;

  completed: boolean;
  goldCrown?: boolean;
};

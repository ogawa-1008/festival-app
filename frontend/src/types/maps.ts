import type { Quest } from "./quest";

export type MapArea = {
  // 号館の番号（ステッカー在庫 API の fieldId と同じ）
  id: number;
  buildingName: string;
  areaName: string;
  // フィールドの画像。未設定のときはフィールド名だけを表示する
  image?: string;
  // フォトスポットのモンスター（ステッカーの絵柄と同じ）
  photoSpotMonster: string;
  questIds: string[];
  novelty: {
    name: string;
    description: string;
    redemptionLocation: string;
    image?: string;
  };
};

// 1つの建物にフォトスポット1つ、対戦クエスト1つ。
export type FieldDefinition = {
  building: number;
  areaName: string;
  photoSpotMonster: string;
  image?: string;
  quest: Quest;
};

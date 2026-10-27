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
    // この号館で交換できるか
    // visited：スタンプを集めた号館なら交換できる（交換場所が決まっていない校舎）
    // here：交換場所に決まっている号館 / none：交換場所ではない号館
    redemptionSpot: "visited" | "here" | "none";
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

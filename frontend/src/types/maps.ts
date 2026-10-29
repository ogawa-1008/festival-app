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

import type { MonsterName } from "../data/monsterFields";

// 校舎のデータに書く内容（号館とフォトスポットのモンスター）
export type FieldInput = {
  building: number;
  // 号館の前に付ける地名（例：心斎橋）。地名のない会場は書かない
  place?: string;
  photoSpotMonster: MonsterName;
};

// 1つの建物にフォトスポット1つ、対戦クエスト1つ。フィールド名と画像はモンスターから決まる
export type FieldDefinition = FieldInput & {
  areaName: string;
  image?: string;
  quest: Quest;
};

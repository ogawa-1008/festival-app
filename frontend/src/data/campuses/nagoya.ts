import { defineFields } from "./defineFields.ts";

// 名古屋校：号館ごとのフォトスポットのモンスター。フィールドはモンスターから決まる（data/monsterFields.ts）
export const nagoyaFields = defineFields("nagoya", [
  {
    building: 1,
    photoSpotMonster: "ジンオウガ",
  },
  {
    building: 2,
    photoSpotMonster: "タマミツネ",
  },
  {
    building: 3,
    photoSpotMonster: "マガイマガド",
  },
]);

import { defineFields } from "./defineFields.ts";

// 名古屋校：号館ごとのフォトスポットのモンスター。フィールドはモンスターから決まる（data/monsterFields.ts）
export const nagoyaFields = defineFields("nagoya", [
  {
    building: 1,
    place: "名古屋",
    photoSpotMonster: "ジンオウガ",
  },
  {
    building: 2,
    place: "名古屋",
    photoSpotMonster: "タマミツネ",
  },
  {
    building: 3,
    place: "名古屋",
    photoSpotMonster: "マガイマガド",
  },
]);

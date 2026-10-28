import { defineFields } from "./defineFields.ts";

// 東京校：号館ごとのフォトスポットのモンスター。フィールドはモンスターから決まる（data/monsterFields.ts）
export const tokyoFields = defineFields("tokyo", [
  {
    building: 1,
    photoSpotMonster: "ジンオウガ",
  },
  {
    building: 3,
    photoSpotMonster: "アルシュベルド",
  },
  {
    building: 4,
    photoSpotMonster: "リオレウス",
  },
  {
    building: 5,
    photoSpotMonster: "メル・ゼナ",
  },
  {
    building: 6,
    photoSpotMonster: "タマミツネ",
  },
  {
    building: 7,
    photoSpotMonster: "マガイマガド",
  },
]);

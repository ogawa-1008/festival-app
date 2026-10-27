import { defineFields } from "./defineFields.ts";

// 大阪校：号館ごとのフォトスポットのモンスター。フィールドはモンスターから決まる（data/monsterFields.ts）
export const osakaFields = defineFields("osaka", [
  {
    building: 1,
    photoSpotMonster: "リオレウス",
  },
  {
    building: 2,
    photoSpotMonster: "アルシュベルド",
  },
  {
    building: 3,
    photoSpotMonster: "メル・ゼナ",
  },
  {
    building: 5,
    photoSpotMonster: "ジンオウガ",
  },
  {
    building: 6,
    photoSpotMonster: "タマミツネ",
  },
]);

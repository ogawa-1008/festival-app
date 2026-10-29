import { defineFields } from "./defineFields.ts";

// 大阪校：号館ごとのフォトスポットのモンスター。フィールドはモンスターから決まる（data/monsterFields.ts）
export const osakaFields = defineFields("osaka", [
  {
    building: 1,
    place: "心斎橋",
    photoSpotMonster: "リオレウス",
  },
  {
    building: 2,
    place: "心斎橋",
    photoSpotMonster: "アルシュベルド",
  },
  {
    building: 3,
    place: "心斎橋",
    photoSpotMonster: "メル・ゼナ",
  },
  {
    building: 5,
    place: "心斎橋",
    photoSpotMonster: "ジンオウガ",
  },
  {
    building: 6,
    place: "本町",
    photoSpotMonster: "タマミツネ",
  },
]);

import { defineFields } from "./defineFields.ts";

// 東京校：号館ごとのフォトスポットのモンスター。フィールドはモンスターから決まる（data/monsterFields.ts）
export const tokyoFields = defineFields("tokyo", [
  {
    building: 1,
    place: "中目黒",
    photoSpotMonster: "ジンオウガ",
  },
  {
    building: 3,
    place: "中目黒",
    photoSpotMonster: "アルシュベルド",
  },
  {
    building: 4,
    place: "恵比寿",
    photoSpotMonster: "リオレウス",
  },
  {
    building: 5,
    place: "恵比寿",
    photoSpotMonster: "メル・ゼナ",
  },
  {
    building: 6,
    place: "中目黒",
    photoSpotMonster: "タマミツネ",
  },
  {
    building: 7,
    place: "五反田",
    photoSpotMonster: "マガイマガド",
  },
  {
    building: 9,
    place: "五反田",
    photoSpotMonster: "ナルガクルガ",
  },
]);

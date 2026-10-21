import type { FieldDefinition } from "../../types/maps.ts";

// 名古屋校：号館ごとのフィールド。出るモンスターは各フィールドの quests に追加する
export const nagoyaFields: FieldDefinition[] = [
  {
    building: 1,
    areaName: "瘴気の谷",
    photoSpotMonster: "ジンオウガ",
    image: "/images/maps/image.png",
    quests: [],
  },
  {
    building: 2,
    areaName: "古代樹の森",
    photoSpotMonster: "タマミツネ",
    image: "/images/maps/image copy.png",
    quests: [],
  },
  {
    building: 3,
    areaName: "大蟻塚",
    photoSpotMonster: "マガイマイド",
    image: "/images/maps/image copy 3.png",
    quests: [],
  },
];

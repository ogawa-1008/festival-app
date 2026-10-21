import type { FieldDefinition } from "../../types/maps.ts";

// 大阪校：号館ごとのフィールド。出るモンスターは各フィールドの quests に追加する
export const osakaFields: FieldDefinition[] = [
  {
    building: 1,
    areaName: "瘴気の谷",
    photoSpotMonster: "リオレウス",
    image: "/images/maps/image.png",
    quests: [],
  },
  {
    building: 2,
    areaName: "古代樹の森",
    photoSpotMonster: "アルシュベルド・アイルー",
    image: "/images/maps/image copy.png",
    quests: [],
  },
  {
    building: 3,
    areaName: "大蟻塚",
    photoSpotMonster: "メルゼナ",
    image: "/images/maps/image copy 3.png",
    quests: [],
  },
  {
    building: 5,
    areaName: "陸珊瑚の台地",
    photoSpotMonster: "ジンオウガ",
    image: "/images/maps/image copy 2.png",
    quests: [],
  },
  {
    building: 6,
    areaName: "龍結晶の地",
    photoSpotMonster: "タマミツネ",
    quests: [],
  },
];

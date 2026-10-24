import { defineFields } from "./defineFields.ts";

// 名古屋校：号館ごとのフィールド。フォトスポットのモンスター1体と対戦する
// 号館ごとの報酬を変えるときは、その号館に rewardMaterials を書く
// （例：rewardMaterials: [{ id: 3, amount: 1 }]。素材の id は data/materials.ts）。書かなければ共通の報酬
export const nagoyaFields = defineFields("nagoya", [
  {
    building: 1,
    areaName: "瘴気の谷",
    photoSpotMonster: "ジンオウガ",
    image: "/images/maps/image.png",
  },
  {
    building: 2,
    areaName: "古代樹の森",
    photoSpotMonster: "タマミツネ",
    image: "/images/maps/image copy.png",
  },
  {
    building: 3,
    areaName: "大蟻塚",
    photoSpotMonster: "マガイマガド",
    image: "/images/maps/image copy 3.png",
  },
]);

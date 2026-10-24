import { defineFields } from "./defineFields.ts";

// 東京校：号館ごとのフィールド。フォトスポットのモンスター1体と対戦する
// 号館ごとの報酬を変えるときは、その号館に rewardMaterials を書く
// （例：rewardMaterials: [{ id: 3, amount: 1 }]。素材の id は data/materials.ts）。書かなければ共通の報酬
export const tokyoFields = defineFields("tokyo", [
  {
    building: 1,
    areaName: "瘴気の谷",
    photoSpotMonster: "ジンオウガ",
    image: "/images/maps/image.png",
  },
  {
    building: 3,
    areaName: "古代樹の森",
    photoSpotMonster: "アルシュベルド・アイルー",
    image: "/images/maps/image copy.png",
  },
  {
    building: 4,
    areaName: "大蟻塚",
    photoSpotMonster: "リオレウス",
    image: "/images/maps/image copy 3.png",
  },
  {
    building: 5,
    areaName: "陸珊瑚の台地",
    photoSpotMonster: "メルゼナ",
    image: "/images/maps/image copy 2.png",
  },
  {
    building: 6,
    areaName: "龍結晶の地",
    photoSpotMonster: "タマミツネ",
  },
  {
    building: 7,
    areaName: "渡りの凍て地",
    photoSpotMonster: "マガイマガド",
  },
]);

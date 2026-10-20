import type { MapArea } from "../types/maps";

export const mapAreas: MapArea[] = [
  {
    id: 1,
    buildingName: "バンタン1号館",
    areaName: "瘴気の谷",
    image: "/images/maps/image.png",
    questIds: ["quest-001"],
    novelty: {
      name: "瘴気の谷限定ノベルティ",
      description: "特典の詳細は会場でご確認ください。",
    },
  },
  {
    id: 2,
    buildingName: "バンタン2号館",
    areaName: "古代樹の森",
    image: "/images/maps/image copy.png",
    questIds: ["quest-002"],
    novelty: {
      name: "古代樹の森限定ノベルティ",
      description: "特典の詳細は会場でご確認ください。",
    },
  },
  {
    id: 3,
    buildingName: "バンタン3号館",
    areaName: "陸珊瑚の台地",
    image: "/images/maps/image copy 2.png",
    questIds: ["quest-003"],
    novelty: {
      name: "陸珊瑚の台地限定ノベルティ",
      description: "特典の詳細は会場でご確認ください。",
    },
  },
  {
    id: 4,
    buildingName: "バンタン4号館",
    areaName: "大蟻塚",
    image: "/images/maps/image copy 3.png",
    questIds: [],
    novelty: {
      name: "大蟻塚限定ノベルティ",
      description: "特典の詳細は会場でご確認ください。",
    },
  },
];

import type { Quest } from "../types/quest";

export const quests: Quest[] = [
  {
    id: "quest-001",
    title: "ジンオウガを討伐せよ！",
    description: "森に現れたモンスターを討伐しよう！",

    image: "/images/quests/image.png",

    qrCode: "QUEST_001",

    rewardMaterials: [
      {
        id: 1,
        amount: 1,
      },
      {
        id: 2,
        amount: 2,
      },
    ],

    completed: false,
  },

  {
    id: "quest-002",
    title: "砂漠のモンスターを討伐せよ！",
    description: "砂漠に現れたモンスターを討伐しよう！",

    image: "/images/quest/desert-monster.png",

    qrCode: "QUEST_002",

    rewardMaterials: [
      {
        id: 2,
        amount: 1,
      },
      {
        id: 3,
        amount: 2,
      },
    ],

    completed: false,
  },

  {
    id: "quest-003",
    title: "強大なモンスターを討伐せよ！",
    description: "強力なモンスターに挑戦しよう！",

    image: "/images/quest/boss-monster.png",

    qrCode: "QUEST_003",

    rewardMaterials: [
      {
        id: 3,
        amount: 1,
      },
      {
        id: 4,
        amount: 1,
      },
    ],

    completed: false,
  },
];
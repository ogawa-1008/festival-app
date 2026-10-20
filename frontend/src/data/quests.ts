import type { Quest } from "../types/quest";
import { battleBalances } from "../game/battle.ts";

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

    maxTurns: 30,

    monsterHp: battleBalances["quest-001"].monsterMaxHp,
    monsterAttack: (battleBalances["quest-001"].monsterDamage.min + battleBalances["quest-001"].monsterDamage.max) / 2,
    monsterAttackMin: battleBalances["quest-001"].monsterDamage.min,
    monsterAttackMax: battleBalances["quest-001"].monsterDamage.max,

    rewardExp: 100,

    completed: false,
  },

  {
    id: "quest-002",
    title: "砂漠のモンスターを討伐せよ！",
    description: "砂漠に現れたモンスターを討伐しよう！",

    image: "/images/quests/image.png",

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

    maxTurns: 30,

    monsterHp: battleBalances["quest-002"].monsterMaxHp,
    monsterAttack: (battleBalances["quest-002"].monsterDamage.min + battleBalances["quest-002"].monsterDamage.max) / 2,
    monsterAttackMin: battleBalances["quest-002"].monsterDamage.min,
    monsterAttackMax: battleBalances["quest-002"].monsterDamage.max,

    rewardExp: 120,

    completed: false,
  },

  {
    id: "quest-003",
    title: "強大なモンスターを討伐せよ！",
    description: "強力なモンスターに挑戦しよう！",

    image: "/images/quests/image.png",

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

    maxTurns: 30,

    monsterHp: battleBalances["quest-003"].monsterMaxHp,
    monsterAttack: (battleBalances["quest-003"].monsterDamage.min + battleBalances["quest-003"].monsterDamage.max) / 2,
    monsterAttackMin: battleBalances["quest-003"].monsterDamage.min,
    monsterAttackMax: battleBalances["quest-003"].monsterDamage.max,

    rewardExp: 150,

    completed: false,
  },
];

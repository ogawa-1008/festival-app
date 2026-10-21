import type { Quest } from "../types/quest";
import { battleBalances } from "../game/battle.ts";
import { allCampusQuests } from "./maps.ts";

// 操作の練習で使うクエスト。練習中だけ、選んでいる校舎の最初のフィールドに出る
export const PRACTICE_QUEST_ID = "quest-001";

export const practiceQuest: Quest = {
  id: PRACTICE_QUEST_ID,
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

  monsterHp: battleBalances[PRACTICE_QUEST_ID].monsterMaxHp,
  monsterAttack: (battleBalances[PRACTICE_QUEST_ID].monsterDamage.min + battleBalances[PRACTICE_QUEST_ID].monsterDamage.max) / 2,
  monsterAttackMin: battleBalances[PRACTICE_QUEST_ID].monsterDamage.min,
  monsterAttackMax: battleBalances[PRACTICE_QUEST_ID].monsterDamage.max,

  rewardExp: 100,

  completed: false,
};

// 練習用と全校舎のクエスト（報酬の経験値など、IDから定義を引くときに使う）
export const quests: Quest[] = [practiceQuest, ...allCampusQuests.map(({ quest }) => quest)];

import type { Quest } from "../types/quest";
import { battleBalances } from "../game/battle.ts";
import { allCampusQuests } from "./maps.ts";
import { defineQuest } from "./questDefinition.ts";
import { DEFAULT_REWARD_MATERIALS } from "./campuses/defineFields.ts";

// 操作の練習で使うクエスト。練習中だけ、選んでいる校舎の最初のフィールドに出る
export const PRACTICE_QUEST_ID = "quest-001";

export const practiceQuest: Quest = defineQuest({
  id: PRACTICE_QUEST_ID,
  title: "ジンオウガを討伐せよ！",
  description: "森に現れたモンスターを討伐しよう！",
  image: "/images/quests/image.png",
  qrCode: "QUEST_001",
  monsterHp: battleBalances[PRACTICE_QUEST_ID].monsterMaxHp,
  monsterDamage: battleBalances[PRACTICE_QUEST_ID].monsterDamage,
  // 練習も本番と同じ共通の報酬にする（練習の最初の所持数はこの報酬から決まる）
  rewardMaterials: DEFAULT_REWARD_MATERIALS,
  rewardExp: 100,
});

// 練習用と全校舎のクエスト（報酬の経験値など、IDから定義を引くときに使う）
export const quests: Quest[] = [practiceQuest, ...allCampusQuests.map(({ quest }) => quest)];

import { DEFAULT_MAX_TURNS, type Quest } from "../types/quest.ts";

// 出るモンスター（クエスト）を書くときの項目
export type QuestDefinition = {
  // 校舎・号館・モンスターで重ならないID（例："tokyo-1-rathalos"）
  id: string;
  title: string;
  description?: string;
  // モンスターの画像（public/images/quests/ に置く）
  image: string;
  // 会場に貼るQRコードの文字列。全校舎で重ならないようにする
  qrCode: string;
  monsterHp: number;
  // 負けたときにプレイヤーが受けるダメージの幅
  monsterDamage: { min: number; max: number };
  // 討伐でもらえる素材（素材の id は data/materials.ts）
  rewardMaterials: Quest["rewardMaterials"];
  // 討伐でもらえる経験値（調査は3割）
  rewardExp: number;
  maxTurns?: number;
};

// 定義からクエストを作る（バトルの強さもここから読む）
export function defineQuest(definition: QuestDefinition): Quest {
  const { monsterDamage, description, maxTurns, ...rest } = definition;

  return {
    ...rest,
    description: description ?? `${definition.title}`,
    maxTurns: maxTurns ?? DEFAULT_MAX_TURNS,
    monsterAttack: (monsterDamage.min + monsterDamage.max) / 2,
    monsterAttackMin: monsterDamage.min,
    monsterAttackMax: monsterDamage.max,
    completed: false,
  };
}

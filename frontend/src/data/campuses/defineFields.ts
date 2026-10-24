import { getBuildingName } from "../campuses.ts";
import type { CampusId } from "../campuses.ts";
import { defineQuest } from "../questDefinition.ts";
import type { MaterialAmount } from "../materials.ts";
import type { FieldDefinition } from "../../types/maps.ts";

// 号館ごとに rewardMaterials を書かなかったときの報酬
export const DEFAULT_REWARD_MATERIALS: MaterialAmount[] = [{ id: 1, amount: 1 }, { id: 2, amount: 2 }];

// フォトスポットと対戦相手は同じ定義から作り、1号館につき1クエストにする。
export function defineFields(
  campusId: CampusId,
  fields: Omit<FieldDefinition, "quest">[],
): FieldDefinition[] {
  return fields.map((field) => ({
    ...field,
    quest: defineQuest({
      id: `${campusId}-${field.building}`,
      title: `${field.photoSpotMonster}を討伐せよ！`,
      description: `${getBuildingName(campusId, field.building)}（${field.areaName}）のフォトスポットで挑戦しよう！`,
      // ジンオウガ以外のイラストは未提供のため、共通のターゲットアイコンを使う。
      image: field.photoSpotMonster === "ジンオウガ"
        ? "/images/quests/image.png"
        : "/images/quests/target.svg",
      qrCode: `QUEST_${campusId.toUpperCase()}_${field.building}`,
      monsterHp: 120,
      monsterDamage: { min: 10, max: 14 },
      rewardMaterials: field.rewardMaterials ?? DEFAULT_REWARD_MATERIALS,
      rewardExp: 100,
    }),
  }));
}

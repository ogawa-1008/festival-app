import { getBuildingName } from "../campuses.ts";
import type { CampusId } from "../campuses.ts";
import { defineQuest } from "../questDefinition.ts";
import { MONSTER_FIELDS } from "../monsterFields.ts";
import type { FieldDefinition, FieldInput } from "../../types/maps.ts";

// フォトスポットと対戦相手は同じ定義から作り、1号館につき1クエストにする。
export function defineFields(
  campusId: CampusId,
  fields: FieldInput[],
): FieldDefinition[] {
  return fields.map((field) => {
    // フィールド名と画像は、モンスターが出てくるフィールドから決める
    const { areaName, image }: { areaName: string; image?: string } = MONSTER_FIELDS[field.photoSpotMonster];
    return {
      ...field,
      areaName,
      image,
      quest: defineQuest({
        id: `${campusId}-${field.building}`,
        title: `${field.photoSpotMonster}を討伐せよ！`,
        description: `${getBuildingName(campusId, field.building)}（${areaName}）のフォトスポットで挑戦しよう！`,
        // ジンオウガ以外のイラストは未提供のため、共通のターゲットアイコンを使う。
        image: field.photoSpotMonster === "ジンオウガ"
          ? "/images/quests/image.png"
          : "/images/quests/target.svg",
        qrCode: `QUEST_${campusId.toUpperCase()}_${field.building}`,
        monsterHp: 120,
        monsterDamage: { min: 10, max: 14 },
        rewardExp: 100,
      }),
    };
  });
}

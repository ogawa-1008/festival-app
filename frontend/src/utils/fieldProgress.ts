import type { MapArea } from "../types/maps.ts";
import type { Quest } from "../types/quest.ts";

// フィールドとクエストはIDで対応づける。表示順が変わっても獲得状況を取り違えない。
export function getFieldProgress(
  area: MapArea,
  quests: Quest[],
  obtainedNoveltyIds: number[],
) {
  const fieldQuests = area.questIds.flatMap((id) => {
    const quest = quests.find((item) => item.id === id);
    return quest ? [quest] : [];
  });
  const earned = fieldQuests.filter((quest) => quest.completed).length;
  // 討伐または調査したクエストの数（ステッカーの交換条件）
  const attempted = fieldQuests.filter(
    (quest) => quest.completed || quest.investigated,
  ).length;
  const available =
    area.questIds.length > 0 && fieldQuests.length === area.questIds.length;
  return {
    quests: fieldQuests,
    earned,
    attempted,
    total: area.questIds.length,
    available,
    complete: available && earned === area.questIds.length,
    // フィールドのモンスターをすべて討伐または調査したらステッカーを交換できる
    redeemable: available && attempted === area.questIds.length,
    // 討伐済みとノベルティの受取済みは別の記録として扱う。
    noveltyObtained: obtainedNoveltyIds.includes(area.id),
  };
}

export function restoreFieldNoveltyIds(
  value: unknown,
  areas: MapArea[],
): number[] {
  return Array.isArray(value)
    ? areas.filter((area) => value.includes(area.id)).map((area) => area.id)
    : [];
}

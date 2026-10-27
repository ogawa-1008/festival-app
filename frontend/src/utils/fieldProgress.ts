import type { MapArea } from "../types/maps.ts";
import type { Quest } from "../types/quest.ts";

export const REQUIRED_STAMPS = 3;

// 選択中の会場の建物だけを数える。再戦・練習・別会場の記録は加算しない。
export function getStampRallyProgress(areas: MapArea[], quests: Quest[], obtainedNoveltyIds: number[]) {
  const visited = new Set<number>();
  const countedQuests = new Set<string>();
  for (const area of areas) {
    if (area.questIds.length !== 1) continue;
    const quest = quests.find((item) => item.id === area.questIds[0]);
    if (quest && (quest.completed || quest.investigated) && !countedQuests.has(quest.id)) {
      visited.add(area.id);
      countedQuests.add(quest.id);
    }
  }
  return {
    earned: visited.size,
    required: REQUIRED_STAMPS,
    remaining: Math.max(0, REQUIRED_STAMPS - visited.size),
    redeemed: areas.some((area) => obtainedNoveltyIds.includes(area.id)),
  };
}

// フィールドとクエストはIDで対応づける。表示順が変わっても獲得状況を取り違えない。
export function getFieldProgress(
  area: MapArea,
  quests: Quest[],
  obtainedNoveltyIds: number[],
  areas: MapArea[],
) {
  const fieldQuests = area.questIds.flatMap((id) => {
    const quest = quests.find((item) => item.id === id);
    return quest ? [quest] : [];
  });
  // 討伐・調査のどちらでも、報酬受取後にその校舎のスタンプを獲得する。
  const attempted = fieldQuests.filter(
    (quest) => quest.completed || quest.investigated,
  ).length;
  const available =
    area.questIds.length === 1 && fieldQuests.length === 1;
  const rally = getStampRallyProgress(areas, quests, obtainedNoveltyIds);
  return {
    area,
    quests: fieldQuests,
    earned: attempted,
    attempted,
    total: area.questIds.length,
    available,
    complete: available && attempted === 1,
    // 3校舎のスタンプで合計1枚。交換場所が決まっている校舎はその号館で、決まっていなければ訪問済みの号館で交換する。
    redeemable: rally.remaining === 0 && !rally.redeemed && (
      area.novelty.redemptionSpot === "here"
      || (area.novelty.redemptionSpot === "visited" && available && attempted === 1)
    ),
    rally,
    // 討伐済みとノベルティの受取済みは別の記録として扱う。
    noveltyObtained: obtainedNoveltyIds.includes(area.id),
  };
}

// ステッカーを交換できる条件の説明（交換画面とスタンプ画面で共通）
export function getRedeemConditionText(progress: ReturnType<typeof getFieldProgress>) {
  if (progress.rally.redeemed) return "ステッカーは1枚受け取り済みです。";
  if (progress.rally.remaining > 0) {
    return `異なる3校舎で討伐・調査を終え、スタンプ3つでステッカー1枚と交換できます（${progress.rally.earned} / ${progress.rally.required}）`;
  }
  if (progress.redeemable) return "スタンプ3つ達成！ このフォトスポットでステッカー1枚と交換できます。";
  if (progress.area.novelty.redemptionSpot === "none") {
    return `この号館では交換できません。${progress.area.novelty.redemptionLocation}で交換してください。`;
  }
  return "この校舎のモンスターを討伐または調査してから交換できます。";
}

export function restoreFieldNoveltyIds(
  value: unknown,
  areas: MapArea[],
): number[] {
  return Array.isArray(value)
    ? areas.filter((area) => value.includes(area.id)).map((area) => area.id)
    : [];
}

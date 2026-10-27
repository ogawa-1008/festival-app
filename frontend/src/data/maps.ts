import { getBuildingName, type CampusId } from "./campuses.ts";
import { nagoyaFields } from "./campuses/nagoya.ts";
import { osakaFields } from "./campuses/osaka.ts";
import { tokyoFields } from "./campuses/tokyo.ts";
import { STICKER, STICKER_REDEMPTION_BUILDINGS } from "./sticker.ts";
import type { FieldDefinition, MapArea } from "../types/maps.ts";
import type { Quest } from "../types/quest.ts";

const campusFields: Record<CampusId, FieldDefinition[]> = {
  tokyo: tokyoFields,
  osaka: osakaFields,
  nagoya: nagoyaFields,
};

// ステッカーを交換できる場所の説明（交換場所が決まっていない校舎は、スタンプを集めた号館）
export function getStickerRedemptionText(campusId: CampusId | null) {
  const buildings = campusId ? STICKER_REDEMPTION_BUILDINGS[campusId] : undefined;
  return buildings && campusId
    // 「心斎橋5、6号館」のように、号館の番号だけを並べる
    ? `${getBuildingName(campusId, buildings[0]).replace(/\d+号館$/, "")}${buildings.join("、")}号館のフォトスポット`
    : "スタンプを集めた号館のフォトスポット";
}

function toMapArea(campusId: CampusId, field: FieldDefinition): MapArea {
  const buildingName = getBuildingName(campusId, field.building);
  const redemptionBuildings = STICKER_REDEMPTION_BUILDINGS[campusId];

  return {
    id: field.building,
    buildingName,
    areaName: field.areaName,
    image: field.image,
    photoSpotMonster: field.photoSpotMonster,
    questIds: [field.quest.id],
    novelty: {
      // ステッカーは1種類（どの号館で交換しても同じ）
      name: STICKER.name,
      description: STICKER.description,
      image: STICKER.image,
      // 交換場所が決まっている校舎は、どの号館でも決まった場所（どちらでもらっても同じ）を案内する
      redemptionLocation: redemptionBuildings
        ? getStickerRedemptionText(campusId)
        : `${buildingName}のフォトスポット`,
      redemptionSpot: !redemptionBuildings
        ? "visited"
        : redemptionBuildings.includes(field.building) ? "here" : "none",
    },
  };
}

const campusMapAreas = Object.fromEntries(
  (Object.entries(campusFields) as [CampusId, FieldDefinition[]][]).map(([campusId, fields]) => [
    campusId,
    fields.map((field) => toMapArea(campusId, field)),
  ]),
) as Record<CampusId, MapArea[]>;

// 校舎のフィールド（号館の番号順）。校舎が未選択なら空
export function getMapAreas(campusId: CampusId | null): MapArea[] {
  return campusId ? campusMapAreas[campusId] : [];
}

// 校舎に出るモンスター（クエスト）の一覧
export function getCampusQuests(campusId: CampusId | null): Quest[] {
  return campusId ? campusFields[campusId].map((field) => field.quest) : [];
}

// すべての校舎のクエスト（QRコードがどの校舎のものかを調べるのに使う）
export const allCampusQuests: { campusId: CampusId; quest: Quest }[] = (
  Object.entries(campusFields) as [CampusId, FieldDefinition[]][]
).flatMap(([campusId, fields]) =>
  fields.map((field) => ({ campusId, quest: field.quest })),
);

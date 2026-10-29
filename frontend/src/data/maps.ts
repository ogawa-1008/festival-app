import { getBuildingName, type CampusId } from "./campuses.ts";
import { nagoyaFields } from "./campuses/nagoya.ts";
import { osakaFields } from "./campuses/osaka.ts";
import { tokyoFields } from "./campuses/tokyo.ts";
import { STICKER } from "./sticker.ts";
import type { FieldDefinition, MapArea } from "../types/maps.ts";
import type { Quest } from "../types/quest.ts";

const campusFields: Record<CampusId, FieldDefinition[]> = {
  tokyo: tokyoFields,
  osaka: osakaFields,
  nagoya: nagoyaFields,
};

function toMapArea(campusId: CampusId, field: FieldDefinition): MapArea {
  const buildingName = getBuildingName(campusId, field.building);

  return {
    id: field.building,
    buildingName,
    areaName: field.areaName,
    image: field.image,
    photoSpotMonster: field.photoSpotMonster,
    questIds: [field.quest.id],
    novelty: {
      // ステッカーは1種類で、どの号館のフォトスポットでも交換できる
      name: STICKER.name,
      description: STICKER.description,
      image: STICKER.image,
      redemptionLocation: `${buildingName}のフォトスポット`,
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

export const campuses = [
  // 大阪校・東京校ではなく、参加するエリアとして表示する
  // buildingPrefix は校舎名の前に付ける地名（分かる会場だけ設定する）
  { id: "osaka", name: "大阪", englishName: "OSAKA", buildingPrefix: "心斎橋" },
  { id: "tokyo", name: "東京", englishName: "TOKYO", buildingPrefix: "" },
  { id: "nagoya", name: "名古屋", englishName: "NAGOYA", buildingPrefix: "" },
] as const;

export type CampusId = (typeof campuses)[number]["id"];

export function findCampus(id: unknown) {
  return campuses.find((campus) => campus.id === id) ?? null;
}

// 画面に出す校舎名（例：心斎橋1号館）。号館番号は会場のQRコードと同じ番号を使う
export function getBuildingName(campusId: CampusId, building: number) {
  const campus = findCampus(campusId);
  return `${campus?.buildingPrefix ?? ""}${building}号館`;
}

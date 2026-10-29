export const campuses = [
  // 大阪校・東京校ではなく、参加するエリアとして表示する
  // 号館の地名（心斎橋・本町など）は号館ごとに違うので、各会場の data/campuses/*.ts に書く
  { id: "osaka", name: "大阪", englishName: "OSAKA" },
  { id: "tokyo", name: "東京", englishName: "TOKYO" },
  { id: "nagoya", name: "名古屋", englishName: "NAGOYA" },
] as const;

export type CampusId = (typeof campuses)[number]["id"];

export function findCampus(id: unknown) {
  return campuses.find((campus) => campus.id === id) ?? null;
}

// 画面に出す校舎名（例：心斎橋1号館）。号館番号は会場のQRコードと同じ番号を使う
export function getBuildingName(field: { building: number; place?: string }) {
  return `${field.place ?? ""}${field.building}号館`;
}

export const campuses = [
  { id: "osaka", name: "大阪校", englishName: "OSAKA" },
  { id: "tokyo", name: "東京校", englishName: "TOKYO" },
  { id: "nagoya", name: "名古屋校", englishName: "NAGOYA" },
] as const;

export type CampusId = (typeof campuses)[number]["id"];

export function findCampus(id: unknown) {
  return campuses.find((campus) => campus.id === id) ?? null;
}

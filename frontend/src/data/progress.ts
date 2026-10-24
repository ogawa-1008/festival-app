import type { ProgressData } from "../types/progress";
import { MATERIALS, type MaterialId } from "./materials.ts";

// 武器の作成に必要な素材（id は data/materials.ts の素材。一覧にない id を書くと型チェックでエラーになる）
const WEAPON_REQUIREMENTS: { id: MaterialId; required: number; owned: number }[] = [
  { id: 1, required: 2, owned: 2 },
  { id: 2, required: 4, owned: 3 },
  { id: 3, required: 3, owned: 7 },
  { id: 4, required: 1, owned: 1 },
];

export const progressData: ProgressData = {
  weaponName: "アギト",

  weaponImage: "/images/progress/C3B5F225-6372-4037-9418-BF36AB832A34_4_5005_c.jpeg",

  // 武器の作成に必要な素材と数（名前・画像は data/materials.ts から）
  materials: WEAPON_REQUIREMENTS.map(({ id, required, owned }) => ({ ...MATERIALS[id], id, required, owned })),

  requiredMoney: 56000,
  currentMoney: 56000,
};
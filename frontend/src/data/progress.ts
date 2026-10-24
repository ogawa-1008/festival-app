import type { ProgressData } from "../types/progress";
import { getMaterial, type MaterialId } from "./materials.ts";

export const progressData: ProgressData = {
  weaponName: "アギト",

  weaponImage: "/images/progress/C3B5F225-6372-4037-9418-BF36AB832A34_4_5005_c.jpeg",

  // 武器の作成に必要な素材と数（名前・画像は data/materials.ts から）
  materials: [
    { id: 1, required: 2, owned: 2 },
    { id: 2, required: 4, owned: 3 },
    { id: 3, required: 3, owned: 7 },
    { id: 4, required: 1, owned: 1 },
  ].map(({ id, required, owned }) => ({ ...getMaterial(id as MaterialId), required, owned })),

  requiredMoney: 56000,
  currentMoney: 56000,
};
import type { MaterialId } from "../data/materials.ts";

export type Material = {
  id: MaterialId;
  name: string;
  required: number;
  owned: number;
  image: string;
};

export type ProgressData = {
  weaponName: string;
  weaponImage: string;
  materials: Material[];
  requiredMoney: number;
  currentMoney: number;
};


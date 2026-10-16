export type Material = {
  id: number;
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


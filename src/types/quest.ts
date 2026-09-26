export type Quest = {
  id: string;
  title: string;
  description: string;

  image: string;

  qrCode: string;

  rewardMaterials: {
    id: number;
    amount: number;
  }[];

  completed: boolean;
  goldCrown?: boolean;
};

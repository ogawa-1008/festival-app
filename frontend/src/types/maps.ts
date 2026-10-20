export type MapArea = {
  id: number;
  buildingName: string;
  areaName: string;
  image: string;
  questIds: string[];
  novelty: {
    name: string;
    description: string;
    image?: string;
  };
};

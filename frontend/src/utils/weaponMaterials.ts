import { progressData } from "../data/progress.ts";

type OwnedMaterials = Record<number, number>;

// 持っている素材の数（記録がない素材は 0 とみなす）
export function getOwnedMaterial(materials: OwnedMaterials, materialId: number) {
  return materials[materialId] ?? 0;
}

// 必要数に届いている素材の種類数
export function countEnoughWeaponMaterials(materials: OwnedMaterials) {
  return progressData.materials.filter(
    (material) => getOwnedMaterial(materials, material.id) >= material.required,
  ).length;
}

// 武器の作成に必要な素材がすべてそろっているか
export function hasEnoughWeaponMaterials(materials: OwnedMaterials) {
  return countEnoughWeaponMaterials(materials) === progressData.materials.length;
}

// 素材の一覧（名前・アイコン）。素材はここだけで定義する。
// 先方からIPの素材（名前・画像）が共有されたら、ここを書き換える。
// id は保存データの所持数のキーと同じなので、変えないこと（増やすときは新しい番号を足す）

const PLACEHOLDER_ICON = "/images/progress/3F7EC100-BED6-4308-A741-BB300F335282.jpeg";

export const MATERIALS = {
  1: { name: "歴戦竜の剛爪", image: PLACEHOLDER_ICON },
  2: { name: "轟断竜の重牙", image: PLACEHOLDER_ICON },
  3: { name: "轟断竜の剛山状殻", image: PLACEHOLDER_ICON },
  4: { name: "轟断竜の天鱗", image: PLACEHOLDER_ICON },
} as const satisfies Record<number, { name: string; image: string }>;

// 素材の id。MATERIALS にない番号を書くと型チェックでエラーになる
export type MaterialId = keyof typeof MATERIALS;

// 報酬・必要数などで使う「素材と数」
export type MaterialAmount = {
  id: MaterialId;
  amount: number;
};

export function isMaterialId(id: number): id is MaterialId {
  return Object.hasOwn(MATERIALS, id);
}

// 素材の名前・アイコン。一覧にない id（型を通らない呼び出しや古いデータ）なら null を返し、呼ぶ側で飛ばす
export function getMaterial(id: number) {
  return isMaterialId(id) ? { id, ...MATERIALS[id] } : null;
}

// 一覧にあるすべての素材の id（番号順）
export const MATERIAL_IDS = Object.keys(MATERIALS).map(Number).filter(isMaterialId);

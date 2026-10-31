// モンスターが出てくるフィールド（どの校舎でも、同じモンスターなら同じフィールドにする）
// 画像はフィールドの画像なので、フィールドと組にして持つ（public/images/fields/）
// フィールドは CAPCOM の確認で決まったもの（ジンオウガ・アルシュベルド・ナルガクルガは指定で変更）
export const MONSTER_FIELDS = {
  リオレウス: { areaName: "古代樹の森", image: "/images/fields/ancient-forest.jpg" },
  ジンオウガ: { areaName: "水没林", image: "/images/fields/flooded-forest.jpg" },
  // 最近の作品で登場するフィールドで、ワールドと世界がつながっている
  タマミツネ: { areaName: "緋の森", image: "/images/fields/scarlet-forest.jpg" },
  アルシュベルド: { areaName: "隔ての砂原", image: "/images/fields/windward-plains.jpg" },
  // メル・ゼナ専用といえる場所があり、西洋らしいフィールド
  "メル・ゼナ": { areaName: "城塞高地", image: "/images/fields/citadel.jpg" },
  // 妖怪がモチーフで、初めて登場した場所
  マガイマガド: { areaName: "大社跡", image: "/images/fields/shrine-ruins.jpg" },
  ナルガクルガ: { areaName: "導きの地", image: "/images/fields/guiding-lands.jpg" },
} as const satisfies Record<string, { areaName: string; image?: string }>;

// フォトスポットのモンスター（この表にないモンスター・書き間違いは型のチェックで分かる）
export type MonsterName = keyof typeof MONSTER_FIELDS;

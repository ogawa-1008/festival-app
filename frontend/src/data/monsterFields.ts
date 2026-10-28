// モンスターが出てくるフィールド（どの校舎でも、同じモンスターなら同じフィールドにする）
// 画像はフィールドの画像なので、フィールドと組にして持つ（正式な画像が届いたら image に入れる）
export const MONSTER_FIELDS = {
  リオレウス: { areaName: "古代樹の森" },
  ジンオウガ: { areaName: "陸珊瑚の台地" },
  // 最近の作品で登場するフィールドで、ワールドと世界がつながっている
  タマミツネ: { areaName: "緋の森" },
  // アルシュベルドの性質に合う場所で、生まれた地という設定
  アルシュベルド: { areaName: "竜都の跡形" },
  // メル・ゼナ専用といえる場所があり、西洋らしいフィールド
  "メル・ゼナ": { areaName: "城塞高地" },
  // 妖怪がモチーフで、初めて登場した場所
  マガイマガド: { areaName: "大社跡" },
} as const satisfies Record<string, { areaName: string; image?: string }>;

// フォトスポットのモンスター（この表にないモンスター・書き間違いは型のチェックで分かる）
export type MonsterName = keyof typeof MONSTER_FIELDS;

// モンスターが出てくるフィールドと、画像のファイル名（どの校舎でも、同じモンスターなら同じにする）
//   areaName … フィールド名。CAPCOM の確認で決まったもの（ジンオウガ・アルシュベルド・ナルガクルガは指定で変更）
//   slug     … モンスターの画像の名前（public/images/monsters/icons/・renders/ の <slug>.webp）
//   field    … フィールドの画像の名前（public/images/fields/ の <field>.webp）
export const MONSTER_FIELDS = {
  リオレウス: { areaName: "古代樹の森", slug: "rathalos", field: "ancient-forest" },
  ジンオウガ: { areaName: "水没林", slug: "zinogre", field: "flooded-forest" },
  // 最近の作品で登場するフィールドで、ワールドと世界がつながっている
  タマミツネ: { areaName: "緋の森", slug: "mizutsune", field: "scarlet-forest" },
  アルシュベルド: { areaName: "隔ての砂原", slug: "arkveld", field: "windward-plains" },
  // メル・ゼナ専用といえる場所があり、西洋らしいフィールド
  "メル・ゼナ": { areaName: "城塞高地", slug: "malzeno", field: "citadel" },
  // 妖怪がモチーフで、初めて登場した場所
  マガイマガド: { areaName: "大社跡", slug: "magnamalo", field: "shrine-ruins" },
  ナルガクルガ: { areaName: "導きの地", slug: "nargacuga", field: "guiding-lands" },
} as const satisfies Record<string, { areaName: string; slug: string; field: string }>;

// フォトスポットのモンスター（この表にないモンスター・書き間違いは型のチェックで分かる）
export type MonsterName = keyof typeof MONSTER_FIELDS;

// フィールドの画像（マップとバトルの背景）
export function getFieldImage(monster: MonsterName) {
  return `/images/fields/${MONSTER_FIELDS[monster].field}.webp`;
}

// クエストに使う画像
//   image       … アイコン。クエストの一覧・スタンプ・リザルトに使う
//   battleImage … 背景を透過した全身の絵。出発前の画面とバトルに使う
//   fieldImage  … バトルでモンスターの後ろに敷く、フィールドの画像
export function getMonsterQuestImages(monster: MonsterName) {
  const { slug } = MONSTER_FIELDS[monster];
  return {
    image: `/images/monsters/icons/${slug}.webp`,
    battleImage: `/images/monsters/renders/${slug}.webp`,
    fieldImage: getFieldImage(monster),
  };
}

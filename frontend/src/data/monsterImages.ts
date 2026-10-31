import type { MonsterName } from "./monsterFields.ts";

// モンスターの画像（public/images/monsters/）
//   icon   … アイコン。クエストの一覧・スタンプ・リザルトに使う
//   render … 背景を透過した全身の絵。出発前の画面とバトルに使う
// MonsterName のすべてに画像がないと型のチェックで分かる
export const MONSTER_IMAGES = {
  リオレウス: { icon: "/images/monsters/icons/rathalos.webp", render: "/images/monsters/renders/rathalos.webp" },
  ジンオウガ: { icon: "/images/monsters/icons/zinogre.webp", render: "/images/monsters/renders/zinogre.webp" },
  タマミツネ: { icon: "/images/monsters/icons/mizutsune.webp", render: "/images/monsters/renders/mizutsune.webp" },
  アルシュベルド: { icon: "/images/monsters/icons/arkveld.webp", render: "/images/monsters/renders/arkveld.webp" },
  "メル・ゼナ": { icon: "/images/monsters/icons/malzeno.webp", render: "/images/monsters/renders/malzeno.webp" },
  マガイマガド: { icon: "/images/monsters/icons/magnamalo.webp", render: "/images/monsters/renders/magnamalo.webp" },
  ナルガクルガ: { icon: "/images/monsters/icons/nargacuga.webp", render: "/images/monsters/renders/nargacuga.webp" },
} as const satisfies Record<MonsterName, { icon: string; render: string }>;

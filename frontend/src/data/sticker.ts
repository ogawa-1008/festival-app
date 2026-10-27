import type { CampusId } from "./campuses.ts";

// フィールド報酬のステッカー。1種類のステッカーに7匹のモンスターが描かれている
// 正式な名前・画像が届いたら、ここを書き換える
export const STICKER = {
  name: "オリジナルステッカー",
  description: "7匹のモンスターが描かれたステッカーです。異なる3校舎のスタンプを集めると、1枚もらえます。",
  image: undefined as string | undefined,
};

// ステッカーを交換できる号館（校舎ごと）。
// 書いていない校舎は、スタンプを集めた号館のフォトスポットならどこでも交換できる
// 大阪は仮。場所が決まったら号館の番号を書き足す
export const STICKER_REDEMPTION_BUILDINGS: Partial<Record<CampusId, number[]>> = {
  osaka: [5, 6],
};

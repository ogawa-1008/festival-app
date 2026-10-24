import type { Hand } from "../utils/battleSession.ts";

// じゃんけんのルール（練習の説明と「？」のポップで同じ文を使う）
export const JANKEN_RULE_TEXT = "グーはチョキに、チョキはパーに、パーはグーに勝ちます。";

// 手の名前（狩猟画面とルールのポップで共通）
export const HAND_LABELS: Record<Hand, string> = {
    rock: "グー",
    scissors: "チョキ",
    paper: "パー",
};

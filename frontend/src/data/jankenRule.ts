import { HANDS, type Hand } from "../game/battle.ts";

// じゃんけんのルール（練習の説明と「？」のポップで同じ文を使う）
export const JANKEN_RULE_TEXT = "グーはチョキに、チョキはパーに、パーはグーに勝ちます。";

// 手の名前（狩猟画面とルールのポップで共通）
export const HAND_LABELS: Record<Hand, string> = {
    rock: "グー",
    scissors: "チョキ",
    paper: "パー",
};

// 手の名前を並べた文（「グー・チョキ・パー」）
export const HAND_NAMES_TEXT = HANDS.map((hand) => HAND_LABELS[hand]).join("・");

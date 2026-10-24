import { ROUND_NAMES } from "../../data/jankenRule.ts";
import type { BattleSession, EndReason, LastRound, RoundResult } from "../../utils/battleSession.ts";

export const START_MESSAGE = "じゃんけんでモンスターを倒せ！";
// 直前の手の記録がない以前の形式のセッションを、途中から再開したとき
export const RESUME_MESSAGE = "続きからモンスターに挑もう！";

export const END_MESSAGES: Record<EndReason, string> = {
    victory: "モンスターを討伐した！",
    defeated: "力尽きてしまった……",
    timeout: "モンスターは逃げてしまった……",
};

// ダメージの数がないとき（あいこ・以前の形式のセッション）の文
const ROUND_MESSAGES: Record<RoundResult, string> = {
    draw: "HPは変わりません",
    player: "モンスターにダメージ！",
    enemy: "ダメージを受けた！",
};

// 勝敗の大きな見出し
export const ROUND_LABELS: Record<RoundResult, string> = {
    player: `${ROUND_NAMES.player}！`,
    enemy: `${ROUND_NAMES.enemy}…`,
    draw: `${ROUND_NAMES.draw}！`,
};

// 直前の手の結果（ダメージ）の文
export function getRoundText(lastRound: LastRound) {
    if (lastRound.result === "draw" || lastRound.damage === undefined) return ROUND_MESSAGES[lastRound.result];

    return lastRound.result === "player"
        ? `モンスターに${lastRound.damage}ダメージ！`
        : `${lastRound.damage}ダメージを受けた！`;
}

type MessageSource = Pick<BattleSession, "lastRound" | "endReason" | "turnsLeft" | "maxTurns">;

// メッセージはセッションから組み立てる（再読み込み後も直前の手と勝敗を表示できる）
// text：メインの文、sub：決着したときに添える最後の手の結果（手切れは「最後の手：勝ち！」の形）
export function getBattleMessage(session: MessageSource): { text: string; sub: string | null } {
    const { lastRound, endReason } = session;

    // 以前の形式のセッションには直前の手が無いため、決着済みかを先に見る
    if (endReason) {
        const sub = !lastRound
            ? null
            : endReason === "timeout"
                ? `最後の手：${ROUND_LABELS[lastRound.result]} ${getRoundText(lastRound)}`
                : getRoundText(lastRound);
        return { text: END_MESSAGES[endReason], sub };
    }
    if (!lastRound) {
        return { text: session.turnsLeft === session.maxTurns ? START_MESSAGE : RESUME_MESSAGE, sub: null };
    }

    return { text: getRoundText(lastRound), sub: null };
}

// 手を使い切ったときは、最後の手の勝敗を大きく出さず、手も光らせない（「討伐失敗」と食い違わないように）
export function getShownRoundResult(session: Pick<BattleSession, "lastRound" | "endReason">): RoundResult | undefined {
    return session.endReason === "timeout" ? undefined : session.lastRound?.result;
}

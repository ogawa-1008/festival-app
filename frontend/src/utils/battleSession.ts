export type Hand = "rock" | "scissors" | "paper";

export type RoundResult = "player" | "enemy" | "draw";

// バトル終了理由（null はバトル中）
export type EndReason = "victory" | "defeated" | "timeout";

// QR 読み取りで開始され、報酬受け取りまでを管理する1戦分の状態
export type BattleSession = {
  questId: string;
  playerHp: number;
  monsterHp: number;
  turnsLeft: number;
  maxTurns: number;
  endReason: EndReason | null;
  goldCrown: boolean;
  claimed: boolean;
  // このセッションを操作できるタブ（複数タブでの二重操作を防ぐ）
  ownerTabId: string;
  startedAt: number;
};

export const BATTLE_MAX_HP = 3;

const GOLD_CROWN_RATE = 0.1;

const HANDS: Hand[] = ["rock", "scissors", "paper"];

const END_REASONS: EndReason[] = ["victory", "defeated", "timeout"];

export function createSession(
  questId: string,
  maxTurns: number,
  ownerTabId: string
): BattleSession {
  return {
    questId,
    playerHp: BATTLE_MAX_HP,
    monsterHp: BATTLE_MAX_HP,
    turnsLeft: maxTurns,
    maxTurns,
    endReason: null,
    goldCrown: false,
    claimed: false,
    ownerTabId,
    startedAt: Date.now(),
  };
}

export function judgeWinner(player: Hand, enemy: Hand): RoundResult {
  if (player === enemy) {
    return "draw";
  }

  if (
    (player === "rock" && enemy === "scissors") ||
    (player === "scissors" && enemy === "paper") ||
    (player === "paper" && enemy === "rock")
  ) {
    return "player";
  }

  return "enemy";
}

export function playRound(
  session: BattleSession,
  playerHand: Hand,
  random: () => number = Math.random
): { session: BattleSession; result: RoundResult } {
  const enemyHand = HANDS[Math.floor(random() * HANDS.length)];
  const result = judgeWinner(playerHand, enemyHand);

  // あいこも含めて1手として数える
  const turnsLeft = session.turnsLeft - 1;
  const monsterHp =
    result === "player" ? Math.max(0, session.monsterHp - 1) : session.monsterHp;
  const playerHp =
    result === "enemy" ? Math.max(0, session.playerHp - 1) : session.playerHp;

  // 終了判定は 討伐 → 力尽きた → 手数切れ の優先順
  const endReason: EndReason | null =
    monsterHp <= 0 ? "victory"
    : playerHp <= 0 ? "defeated"
    : turnsLeft <= 0 ? "timeout"
    : null;

  return {
    session: {
      ...session,
      playerHp,
      monsterHp,
      turnsLeft,
      endReason,
      // 金冠は討伐が決まった時点で1回だけ抽選し、セッションに保存する
      goldCrown: endReason === "victory" && random() < GOLD_CROWN_RATE,
    },
    result,
  };
}

// localStorage から読んだ値を検証し、形が不正なら null を返す
export function parseSession(value: unknown): BattleSession | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const data = value as Record<string, unknown>;
  const isCount = (item: unknown): item is number =>
    typeof item === "number" && Number.isInteger(item) && item >= 0;

  if (
    typeof data.questId !== "string" ||
    !isCount(data.playerHp) ||
    !isCount(data.monsterHp) ||
    !isCount(data.turnsLeft) ||
    !isCount(data.maxTurns) ||
    !(data.endReason === null || END_REASONS.includes(data.endReason as EndReason)) ||
    typeof data.goldCrown !== "boolean" ||
    typeof data.claimed !== "boolean" ||
    typeof data.ownerTabId !== "string" ||
    typeof data.startedAt !== "number"
  ) {
    return null;
  }

  return {
    questId: data.questId,
    playerHp: data.playerHp,
    monsterHp: data.monsterHp,
    turnsLeft: data.turnsLeft,
    maxTurns: data.maxTurns,
    endReason: data.endReason as EndReason | null,
    goldCrown: data.goldCrown,
    claimed: data.claimed,
    ownerTabId: data.ownerTabId,
    startedAt: data.startedAt,
  };
}

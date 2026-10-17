export type Hand = "rock" | "scissors" | "paper";

export type RoundResult = "player" | "enemy" | "draw";

// バトル終了理由（null はバトル中）
export type EndReason = "victory" | "defeated" | "timeout";

// 直前の1手（再読み込み後もお互いの手と勝敗を表示するため保存する）
export type LastRound = {
  playerHand: Hand;
  enemyHand: Hand;
  result: RoundResult;
};

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
  lastRound: LastRound | null;
  // 次に手を出せる時刻（それまではターン帯を表示して待つ）。再読み込みしても引き継ぐ
  nextTurnAt: number;
  // このセッションを操作できるタブ（複数タブでの二重操作を防ぐ）
  ownerTabId: string;
  startedAt: number;
};

export const BATTLE_MAX_HP = 3;

// 手を出してから次の手を出せるまでの時間（ターン帯を表示する時間）
export const TURN_COOLDOWN_MS = 1500;

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
    lastRound: null,
    // 開始時も「1ターン目」の帯を出すため待ち時間を入れる
    nextTurnAt: Date.now() + TURN_COOLDOWN_MS,
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
  random: () => number = Math.random,
  now: number = Date.now()
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
      lastRound: { playerHand, enemyHand, result },
      // 決着がついた手のあとは次のターンへ進まない
      nextTurnAt: endReason === null ? now + TURN_COOLDOWN_MS : 0,
    },
    result,
  };
}

const RESULTS: RoundResult[] = ["player", "enemy", "draw"];

function parseLastRound(value: unknown): LastRound | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as Record<string, unknown>;

  if (
    !HANDS.includes(data.playerHand as Hand) ||
    !HANDS.includes(data.enemyHand as Hand) ||
    !RESULTS.includes(data.result as RoundResult)
  ) {
    return null;
  }

  return {
    playerHand: data.playerHand as Hand,
    enemyHand: data.enemyHand as Hand,
    result: data.result as RoundResult,
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
    // 以前のバージョンで保存されたセッションには無いため、初期値で補う
    lastRound: parseLastRound(data.lastRound),
    nextTurnAt: typeof data.nextTurnAt === "number" ? data.nextTurnAt : 0,
    ownerTabId: data.ownerTabId,
    startedAt: data.startedAt,
  };
}

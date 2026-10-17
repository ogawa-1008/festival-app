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
  // バトル開始時のステータス（途中で武器を交換しても、このバトルの間は変わらない）
  playerMaxHp: number;
  playerAttack: number;
  monsterMaxHp: number;
  monsterAttack: number;
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

// バトル開始時に決まるステータス
export type BattleStats = {
  maxTurns: number;
  playerMaxHp: number;
  playerAttack: number;
  monsterMaxHp: number;
  monsterAttack: number;
};

// ステータス項目が無いセッション（導入前に保存されたもの）を補う値。当時は HP 3・ダメージ 1 固定
// ※新しくクエストを作るときの既定値（types/quest.ts の DEFAULT_*）とは別物
const LEGACY_SESSION_MAX_HP = 3;
const LEGACY_SESSION_ATTACK = 1;

// 手を出してから次の手を出せるまでの時間（ターン帯を表示する時間）
export const TURN_COOLDOWN_MS = 1500;

// 「討伐開始」「討伐成功」「討伐失敗」の帯を表示する時間
export const HUNT_BANNER_MS = 1500;

// 開始時は「討伐開始」→「1ターン目」の帯を続けて出してから手を出せる
const START_WAIT_MS = HUNT_BANNER_MS + TURN_COOLDOWN_MS;

const GOLD_CROWN_RATE = 0.1;

const HANDS: Hand[] = ["rock", "scissors", "paper"];

const END_REASONS: EndReason[] = ["victory", "defeated", "timeout"];

export function createSession(
  questId: string,
  stats: BattleStats,
  ownerTabId: string
): BattleSession {
  return {
    questId,
    playerHp: stats.playerMaxHp,
    monsterHp: stats.monsterMaxHp,
    turnsLeft: stats.maxTurns,
    ...stats,
    endReason: null,
    goldCrown: false,
    claimed: false,
    lastRound: null,
    // 開始時は「討伐開始」「1ターン目」の帯を出すため待ち時間を入れる
    nextTurnAt: Date.now() + START_WAIT_MS,
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
  // 勝てば自分の攻撃力、負ければモンスターの攻撃力の分だけダメージ
  const monsterHp =
    result === "player"
      ? Math.max(0, session.monsterHp - session.playerAttack)
      : session.monsterHp;
  const playerHp =
    result === "enemy"
      ? Math.max(0, session.playerHp - session.monsterAttack)
      : session.playerHp;

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

function readPositive(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : fallback;
}

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
    // ステータス導入前に保存されたセッションには無いため、当時の値で補う
    // 古い画面が保存し直して項目が消えた場合も、最大HPが今のHPを下回らないようにする
    playerMaxHp: Math.max(
      readPositive(data.playerMaxHp, LEGACY_SESSION_MAX_HP),
      data.playerHp
    ),
    playerAttack: readPositive(data.playerAttack, LEGACY_SESSION_ATTACK),
    monsterMaxHp: Math.max(
      readPositive(data.monsterMaxHp, LEGACY_SESSION_MAX_HP),
      data.monsterHp
    ),
    monsterAttack: readPositive(data.monsterAttack, LEGACY_SESSION_ATTACK),
    endReason: data.endReason as EndReason | null,
    goldCrown: data.goldCrown,
    claimed: data.claimed,
    // 以前のバージョンで保存されたセッションには無いため、初期値で補う
    lastRound: parseLastRound(data.lastRound),
    // 最長の待ち時間より先の時刻（端末の時計が戻った等）は不正とみなし、待ち時間なしにする
    // （上限に置き換えると読むたびに値が変わり、いつまでも待ち時間が終わらなくなる）
    nextTurnAt:
      typeof data.nextTurnAt === "number" &&
      data.nextTurnAt <= Date.now() + START_WAIT_MS
        ? data.nextTurnAt
        : 0,
    ownerTabId: data.ownerTabId,
    startedAt: data.startedAt,
  };
}

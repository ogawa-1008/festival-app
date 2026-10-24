export type Hand = "rock" | "scissors" | "paper";
type DamageRange = { min: number; max: number };
export type BattleBalance = {
  monsterMaxHp: number;
  playerDamage: DamageRange;
  monsterDamage: DamageRange;
};
export type BattleState = {
  playerHp: number;
  monsterHp: number;
  round: number;
  outcome: "draw" | "player" | "enemy" | null;
  damage: number;
  status: "playing" | "victory" | "failure";
};

export const hunterMaxHp = 100;
export const turnFeedbackMs = 1500;
// Festival pacing: roughly 4 / 5 / 6 winning hands per hunt, with enough
// tolerance for losses that a short visit can still end in a successful hunt.
export const battleBalances: Record<string, BattleBalance> = {
  "quest-001": { monsterMaxHp: 120, playerDamage: { min: 28, max: 36 }, monsterDamage: { min: 10, max: 14 } },
  "quest-002": { monsterMaxHp: 150, playerDamage: { min: 28, max: 36 }, monsterDamage: { min: 12, max: 16 } },
  "quest-003": { monsterMaxHp: 180, playerDamage: { min: 28, max: 36 }, monsterDamage: { min: 12, max: 16 } },
};
export function getBattleBalance(questId: string) {
  // Resolve from current configuration, not the saved quest snapshot. Existing
  // saves receive balance changes without resetting progress or inventory.
  return battleBalances[questId] ?? battleBalances["quest-001"];
}
export function createBattle(balance: BattleBalance): BattleState {
  return { playerHp: hunterMaxHp, monsterHp: balance.monsterMaxHp, round: 0, outcome: null, damage: 0, status: "playing" };
}
// 手の並び（狩猟画面のボタン・ルールの図・セッションの検証で共通）
export const HANDS: readonly Hand[] = ["rock", "scissors", "paper"];
export function chooseEnemyHand(random = Math.random): Hand {
  return HANDS[Math.floor(random() * HANDS.length)];
}
export function practiceEnemyHand(player: Hand, round: number): Hand {
  // Experience a draw, a loss, then wins until the same real HP rules conclude.
  return HANDS[(HANDS.indexOf(player) + (round === 0 ? 0 : round === 1 ? 2 : 1)) % 3];
}
export function judgeWinner(player: Hand, enemy: Hand): "player" | "enemy" | "draw" {
  if (player === enemy) return "draw";
  return HANDS[(HANDS.indexOf(player) + 1) % 3] === enemy ? "player" : "enemy";
}
export function resolveTurn(state: BattleState, balance: BattleBalance, player: Hand, enemy: Hand, random = Math.random): BattleState {
  if (state.status !== "playing") return state;
  const round = state.round + 1;
  const outcome = judgeWinner(player, enemy);
  if (outcome === "draw") return { ...state, round, outcome, damage: 0 };
  const won = outcome === "player";
  const range = won ? balance.playerDamage : balance.monsterDamage;
  const rolled = range.min === range.max ? range.min : range.min + Math.floor(random() * (range.max - range.min + 1));
  const damage = Math.min(rolled, won ? state.monsterHp : state.playerHp);
  const monsterHp = state.monsterHp - (won ? damage : 0);
  const playerHp = state.playerHp - (won ? 0 : damage);
  return {
    playerHp, monsterHp, round, damage, outcome: won ? "player" : "enemy",
    status: monsterHp === 0 ? "victory" : playerHp === 0 ? "failure" : "playing",
  };
}

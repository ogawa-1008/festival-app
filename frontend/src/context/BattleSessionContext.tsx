import { practiceBattleStorageKey } from "../components/Tutorial/tutorialSteps";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  createSession,
  isUntouchedSession,
  restartSessionClock,
  parseSession,
  playRound,
  type BattleSession,
  type BattleStats,
  type Hand,
  type RoundResult,
} from "../utils/battleSession";
import { useStorageSync } from "./useStorageSync";

// "battle" | "result": その画面へ進む
// "confirm": 進める前に確認が必要（questId は対象になる既存セッションのクエスト）
//   takeover: 別タブの同じクエストの戦闘中・受け取り前の結果 → このタブで引き継ぐ
//   discard: 別クエストの戦闘中 → 破棄して新しく始める
//   isElsewhere: 既存セッションが別タブのものか
type StartResult =
  | { type: "battle"; questId: string }
  | { type: "result"; questId: string }
  | {
      type: "confirm";
      mode: "takeover" | "discard";
      questId: string;
      isElsewhere: boolean;
    };

type BattleSessionContextType = {
  session: BattleSession | null;
  // このタブで開いていたセッションが別タブに引き継がれた
  takenOver: boolean;
  startBattle: (
    questId: string,
    stats: BattleStats,
    options?: { force?: boolean }
  ) => StartResult;
  registerScreen: () => () => void;
  playHand: (
    hand: Hand
  ) => { session: BattleSession; result: RoundResult } | null;
  claimReward: () => boolean;
  // 確認画面で「狩猟を始める」を押した：開始の時刻を合わせ直す。始められなければ false
  beginBattle: (questId: string) => boolean;
  // 確認画面で「戻る」を押した：まだ1手も出していないセッションなら取り消す
  cancelBattle: (questId: string) => void;
};

// 進行中の1戦は GameState（確定した進行度）とは別キーで保存する
const storageKey = "monster-hunter-festival-battle";

const tabIdKey = "monster-hunter-festival-tab-id";

// タブごとのID。sessionStorage はタブ単位で、再読み込みしても変わらない
// （再読み込みでは確認なしで続けられ、別タブからは必ず確認が出る）
function loadTabId() {
  const fresh = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  try {
    const saved = window.sessionStorage.getItem(tabIdKey);

    if (saved) {
      return saved;
    }

    window.sessionStorage.setItem(tabIdKey, fresh);
  } catch {
    // sessionStorage が使えない環境ではページを読み込むたびに新しいIDになる
  }

  return fresh;
}

const tabId = typeof window === "undefined" ? "" : loadTabId();

// 読み込めない環境では fallback を返す
function loadSession(
  fallback: BattleSession | null = null,
  practice = false
): BattleSession | null {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const saved = practice ? window.sessionStorage.getItem(practiceBattleStorageKey) : window.localStorage.getItem(storageKey);

    return saved ? parseSession(JSON.parse(saved)) : null;
  } catch {
    return fallback;
  }
}

function saveSession(session: BattleSession | null, practice = false) {
  try {
    const storage = practice ? window.sessionStorage : window.localStorage;
    const key = practice ? practiceBattleStorageKey : storageKey;
    if (session) {
      storage.setItem(key, JSON.stringify(session));
    } else {
      storage.removeItem(key);
    }
  } catch {
    // localStorage が使えない環境ではメモリ上だけで続行する
  }
}

const BattleSessionContext =
  createContext<BattleSessionContextType | null>(null);

export function BattleSessionProvider({ children, practice = false }: { children: ReactNode; practice?: boolean }) {
  const [session, setSession] = useState<BattleSession | null>(() => loadSession(null, practice));
  const [takenOver, setTakenOver] = useState(false);

  // 連打時に再レンダリング前の古い値で判定しないよう、Refで同期的に最新値を持つ
  const sessionRef = useRef(session);
  // このタブでバトル・リザルト画面を開いている数
  const screenCountRef = useRef(0);

  const update = useCallback((next: BattleSession | null) => {
    sessionRef.current = next;
    setSession(next);
    saveSession(next, practice);

    if (next?.ownerTabId === tabId) {
      setTakenOver(false);
    }
  }, [practice]);

  // 別タブでの変更を反映し続けるため、操作の直前に localStorage から読み直す
  const readLatest = useCallback(() => loadSession(sessionRef.current, practice), [practice]);

  // このタブが持ち主のセッションを返す。別タブに引き継がれていれば画面を終了させて null
  const readOwned = useCallback(() => {
    const current = readLatest();

    if (current?.ownerTabId === tabId) {
      return current;
    }

    sessionRef.current = current;
    setSession(current);
    setTakenOver(true);

    return null;
  }, [readLatest]);

  useStorageSync(storageKey, () => {
    const next = loadSession(sessionRef.current);
    const previous = sessionRef.current;

    // 中身が変わっていなければ何もしない（表示に戻るたびの再描画を防ぐ）
    if (JSON.stringify(next) === JSON.stringify(previous)) return;

    // 画面を開いている間に持ち主が別タブへ移ったら、このタブの画面は終了させる
    if (
      screenCountRef.current > 0 &&
      previous?.ownerTabId === tabId &&
      next?.ownerTabId !== tabId
    ) {
      setTakenOver(true);
    }

    sessionRef.current = next;
    setSession(next);
  }, !practice);

  const adopt = useCallback(
    (current: BattleSession) => {
      if (current.ownerTabId !== tabId) {
        update({ ...current, ownerTabId: tabId });
      }
    },
    [update]
  );

  // force: 確認済み（別タブ・別クエスト戦闘中でも進めてよい）
  const startBattle = useCallback(
    (
      questId: string,
      stats: BattleStats,
      options?: { force?: boolean }
    ): StartResult => {
      const current = readLatest();

      if (current !== null && !current.claimed) {
        // 同じクエストの戦闘中・受け取り前の結果は、確認後も作り直さずに引き継ぐ
        // （別タブを使ってHP・手数を回復させたり、勝利を消したりできないようにする）
        const canTakeOver =
          current.endReason !== null || current.questId === questId;
        const isElsewhere = current.ownerTabId !== tabId;

        // 別タブのセッションは、引き継ぐ・破棄する前に必ず確認する
        if (!options?.force && isElsewhere) {
          return {
            type: "confirm",
            mode: canTakeOver ? "takeover" : "discard",
            questId: current.questId,
            isElsewhere,
          };
        }

        // 受け取り前の決着済みセッションがあれば、先にそのリザルトへ案内する
        if (current.endReason !== null) {
          adopt(current);

          return { type: "result", questId: current.questId };
        }

        // 同じクエストが戦闘中なら再開し、QRの読み直しでHP・手数を回復させない
        if (current.questId === questId) {
          adopt(current);

          return { type: "battle", questId };
        }

        // 別クエストが戦闘中なら、破棄してよいか確認してから上書きする
        if (!options?.force) {
          return {
            type: "confirm",
            mode: "discard",
            questId: current.questId,
            isElsewhere,
          };
        }
      }

      // それ以外（受け取り済み・破棄を選んだ場合）は上書きする
      update(createSession(questId, stats, tabId));

      return { type: "battle", questId };
    },
    [readLatest, adopt, update]
  );

  const registerScreen = useCallback(() => {
    screenCountRef.current += 1;

    return () => {
      screenCountRef.current -= 1;

      if (screenCountRef.current === 0) {
        setTakenOver(false);
      }
    };
  }, []);

  const playHand = useCallback(
    (hand: Hand) => {
      // 別タブに引き継がれたセッションは操作させない
      const current = readOwned();

      if (!current || current.endReason !== null) {
        return null;
      }

      // ターン帯を表示している待ち時間中の入力は受け付けない
      const now = Date.now();

      if (now < current.nextTurnAt) {
        return null;
      }

      const round = playRound(current, hand, Math.random, now, practice);

      update(round.session);

      return round;
    },
    [readOwned, update, practice]
  );

  const claimReward = useCallback(() => {
    const current = readOwned();

    if (!current || current.endReason === null || current.claimed) {
      return false;
    }

    update({ ...current, claimed: true });

    return true;
  }, [readOwned, update]);

  // 確認画面には「引き継がれた」状態（takenOver）を持ち込まないよう、readOwned ではなく
  // 最新の値を読んで canBeginBattle で確かめる
  const beginBattle = useCallback((questId: string) => {
    const current = readLatest();

    if (!current || !canBeginBattle(current, questId)) {
      return false;
    }

    update(restartSessionClock(current));

    return true;
  }, [readLatest, update]);

  const cancelBattle = useCallback((questId: string) => {
    const current = readLatest();

    // 自分のタブの、同じクエストで、まだ1手も出していないセッションだけを取り消す
    if (current && canBeginBattle(current, questId) && isUntouchedSession(current)) {
      update(null);
    }
  }, [readLatest, update]);

  const value = useMemo<BattleSessionContextType>(
    () => ({
      session,
      takenOver,
      startBattle,
      registerScreen,
      playHand,
      claimReward,
      beginBattle,
      cancelBattle,
    }),
    [
      session,
      takenOver,
      startBattle,
      registerScreen,
      playHand,
      claimReward,
      beginBattle,
      cancelBattle,
    ]
  );

  return (
    <BattleSessionContext.Provider value={value}>
      {children}
    </BattleSessionContext.Provider>
  );
}

// このタブが持ち主のセッションか（未受け取りのバトル・リザルトは持ち主のタブでのみ表示する）
export function isOwnedByThisTab(session: BattleSession | null) {
  return session?.ownerTabId === tabId;
}

// このタブで、このクエストの対戦を始められる（QRを読んでできた、決着前・受け取り前のセッションがある）か
// 確認画面のボタンの表示と、「狩猟を始める」を押したときの判定の両方で使う
export function canBeginBattle(session: BattleSession | null, questId: string | undefined): session is BattleSession {
  return session !== null
    && session.questId === questId
    && !session.claimed
    && session.endReason === null
    && isOwnedByThisTab(session);
}

export function useBattleSession() {
  const context = useContext(BattleSessionContext);

  if (!context) {
    throw new Error("useBattleSession must be used inside BattleSessionProvider");
  }

  return context;
}

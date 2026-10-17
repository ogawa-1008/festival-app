import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  createSession,
  parseSession,
  playRound,
  type BattleSession,
  type Hand,
  type RoundResult,
} from "../utils/battleSession";

type BattleSessionContextType = {
  session: BattleSession | null;
  startBattle: (questId: string, maxTurns: number) => BattleSession;
  playHand: (
    hand: Hand
  ) => { session: BattleSession; result: RoundResult } | null;
  claimReward: () => boolean;
};

// 進行中の1戦は GameState（確定した進行度）とは別キーで保存する
const storageKey = "monster-hunter-festival-battle";

function loadSession(): BattleSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const saved = window.localStorage.getItem(storageKey);

    return saved ? parseSession(JSON.parse(saved)) : null;
  } catch {
    return null;
  }
}

const BattleSessionContext =
  createContext<BattleSessionContextType | null>(null);

export function BattleSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<BattleSession | null>(loadSession);

  // 連打時に再レンダリング前の古い値で判定しないよう、Refで同期的に最新値を持つ
  const sessionRef = useRef(session);

  useEffect(() => {
    try {
      if (session) {
        window.localStorage.setItem(storageKey, JSON.stringify(session));
      } else {
        window.localStorage.removeItem(storageKey);
      }
    } catch {
      // localStorage が使えない環境ではメモリ上だけで続行する
    }
  }, [session]);

  const value = useMemo<BattleSessionContextType>(() => {
    const update = (next: BattleSession) => {
      sessionRef.current = next;
      setSession(next);
    };

    const startBattle = (questId: string, maxTurns: number) => {
      const current = sessionRef.current;

      // 同じクエストが戦闘中なら再開し、QRの読み直しでHP・手数を回復させない
      if (current && current.questId === questId && current.endReason === null) {
        return current;
      }

      // それ以外（別クエスト・終了済み）は上書きする
      const next = createSession(questId, maxTurns);

      update(next);

      return next;
    };

    const playHand = (hand: Hand) => {
      const current = sessionRef.current;

      if (!current || current.endReason !== null) {
        return null;
      }

      const round = playRound(current, hand);

      update(round.session);

      return round;
    };

    const claimReward = () => {
      const current = sessionRef.current;

      if (!current || current.endReason === null || current.claimed) {
        return false;
      }

      update({ ...current, claimed: true });

      return true;
    };

    return { session, startBattle, playHand, claimReward };
  }, [session]);

  return (
    <BattleSessionContext.Provider value={value}>
      {children}
    </BattleSessionContext.Provider>
  );
}

export function useBattleSession() {
  const context = useContext(BattleSessionContext);

  if (!context) {
    throw new Error("useBattleSession must be used inside BattleSessionProvider");
  }

  return context;
}

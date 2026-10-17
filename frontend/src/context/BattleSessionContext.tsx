import {
  createContext,
  useCallback,
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

// "battle" | "result": その画面へ進む / "conflict": 別タブで開いているので確認が必要
type StartResult =
  | { type: "battle"; questId: string }
  | { type: "result"; questId: string }
  | { type: "conflict" };

// "ok": この画面を表示してよい / "conflict": 別タブで開いているので確認が必要
type AccessResult = "ok" | "conflict";

type BattleSessionContextType = {
  session: BattleSession | null;
  // このタブで開いていたセッションが別タブに引き継がれた
  takenOver: boolean;
  startBattle: (
    questId: string,
    maxTurns: number,
    options?: { force?: boolean }
  ) => Promise<StartResult>;
  checkAccess: (questId: string | undefined) => Promise<AccessResult>;
  discardSession: () => void;
  registerScreen: () => () => void;
  playHand: (
    hand: Hand
  ) => { session: BattleSession; result: RoundResult } | null;
  claimReward: () => boolean;
};

// 進行中の1戦は GameState（確定した進行度）とは別キーで保存する
const storageKey = "monster-hunter-festival-battle";

// 持ち主タブの応答を待つ時間。応答がなければ閉じた・再読み込みしたとみなす
const PING_TIMEOUT_MS = 300;

// ページを読み込むたびに変わるタブID（再読み込み後は持ち主タブが応答しないので引き継げる）
const tabId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

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

function saveSession(session: BattleSession | null) {
  try {
    if (session) {
      window.localStorage.setItem(storageKey, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(storageKey);
    }
  } catch {
    // localStorage が使えない環境ではメモリ上だけで続行する
  }
}

const BattleSessionContext =
  createContext<BattleSessionContextType | null>(null);

export function BattleSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<BattleSession | null>(loadSession);
  const [takenOver, setTakenOver] = useState(false);

  // 連打時に再レンダリング前の古い値で判定しないよう、Refで同期的に最新値を持つ
  const sessionRef = useRef(session);
  const channelRef = useRef<BroadcastChannel | null>(null);
  // このタブでバトル・リザルト画面を開いている数
  const screenCountRef = useRef(0);

  const update = useCallback((next: BattleSession | null) => {
    sessionRef.current = next;
    setSession(next);
    saveSession(next);

    if (next?.ownerTabId === tabId) {
      setTakenOver(false);
    }
  }, []);

  // 別タブでの変更を反映し続けるため、操作の直前に localStorage から読み直す
  const readLatest = useCallback(() => {
    if (typeof window === "undefined") {
      return sessionRef.current;
    }

    try {
      const saved = window.localStorage.getItem(storageKey);

      return saved ? parseSession(JSON.parse(saved)) : null;
    } catch {
      return sessionRef.current;
    }
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey && event.key !== null) return;

      const next = loadSession();
      const previous = sessionRef.current;

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
    };

    window.addEventListener("storage", handleStorage);

    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // 子画面の effect は Provider の effect より先に走るため、チャンネルは初回利用時に作る
  const getChannel = useCallback(() => {
    if (channelRef.current || typeof BroadcastChannel === "undefined") {
      return channelRef.current;
    }

    const channel = new BroadcastChannel(storageKey);

    // 持ち主タブでバトル・リザルト画面を開いていれば応答する
    channel.onmessage = (event: MessageEvent) => {
      const message = event.data as { type?: string; target?: string; nonce?: string };

      if (
        message?.type === "ping" &&
        message.target === tabId &&
        screenCountRef.current > 0
      ) {
        channel.postMessage({ type: "pong", nonce: message.nonce });
      }
    };

    channelRef.current = channel;

    return channel;
  }, []);

  // Provider はアプリ全体で1つなので閉じない（StrictMode の後片付けで閉じると応答を取りこぼす）
  useEffect(() => {
    getChannel();
  }, [getChannel]);

  // 持ち主タブがバトル・リザルト画面を開いているか問い合わせる
  const isOpenElsewhere = useCallback((ownerTabId: string) => {
    return new Promise<boolean>((resolve) => {
      const channel = getChannel();

      if (!channel || ownerTabId === tabId) {
        resolve(false);
        return;
      }

      const nonce = Math.random().toString(36).slice(2);

      const finish = (isOpen: boolean) => {
        clearTimeout(timerId);
        channel.removeEventListener("message", handleMessage);
        resolve(isOpen);
      };

      const handleMessage = (event: MessageEvent) => {
        const message = event.data as { type?: string; nonce?: string };

        if (message?.type === "pong" && message.nonce === nonce) {
          finish(true);
        }
      };

      const timerId = setTimeout(() => finish(false), PING_TIMEOUT_MS);

      channel.addEventListener("message", handleMessage);
      channel.postMessage({ type: "ping", target: ownerTabId, nonce });
    });
  }, [getChannel]);

  const adopt = useCallback(
    (current: BattleSession) => {
      if (current.ownerTabId !== tabId) {
        update({ ...current, ownerTabId: tabId });
      }
    },
    [update]
  );

  const startBattle = useCallback(
    async (questId: string, maxTurns: number, options?: { force?: boolean }) => {
      const current = readLatest();
      const isUnclaimed = current !== null && !current.claimed;

      if (
        !options?.force &&
        isUnclaimed &&
        (await isOpenElsewhere(current.ownerTabId))
      ) {
        return { type: "conflict" } as const;
      }

      if (!options?.force && isUnclaimed) {
        // 受け取り前の決着済みセッションがあれば、先にそのリザルトへ案内する
        if (current.endReason !== null) {
          adopt(current);

          return { type: "result", questId: current.questId } as const;
        }

        // 同じクエストが戦闘中なら再開し、QRの読み直しでHP・手数を回復させない
        if (current.questId === questId) {
          adopt(current);

          return { type: "battle", questId } as const;
        }
      }

      // それ以外（受け取り済み・別クエストの戦闘中・破棄を選んだ場合）は上書きする
      update(createSession(questId, maxTurns, tabId));

      return { type: "battle", questId } as const;
    },
    [readLatest, isOpenElsewhere, adopt, update]
  );

  const checkAccess = useCallback(
    async (questId: string | undefined): Promise<AccessResult> => {
      const current = readLatest();

      // セッションなし・別クエスト・受け取り済みは各画面の判定に任せる
      if (!current || current.questId !== questId || current.claimed) {
        return "ok";
      }

      if (await isOpenElsewhere(current.ownerTabId)) {
        return "conflict";
      }

      adopt(current);

      return "ok";
    },
    [readLatest, isOpenElsewhere, adopt]
  );

  const discardSession = useCallback(() => {
    update(null);
  }, [update]);

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
      const current = readLatest();

      // 別タブに引き継がれたセッションは操作させない
      if (current?.ownerTabId !== tabId) {
        sessionRef.current = current;
        setSession(current);
        setTakenOver(true);

        return null;
      }

      if (current.endReason !== null) {
        return null;
      }

      const round = playRound(current, hand);

      update(round.session);

      return round;
    },
    [readLatest, update]
  );

  const claimReward = useCallback(() => {
    const current = readLatest();

    if (current?.ownerTabId !== tabId) {
      sessionRef.current = current;
      setSession(current);
      setTakenOver(true);

      return false;
    }

    if (current.endReason === null || current.claimed) {
      return false;
    }

    update({ ...current, claimed: true });

    return true;
  }, [readLatest, update]);

  const value = useMemo<BattleSessionContextType>(
    () => ({
      session,
      takenOver,
      startBattle,
      checkAccess,
      discardSession,
      registerScreen,
      playHand,
      claimReward,
    }),
    [
      session,
      takenOver,
      startBattle,
      checkAccess,
      discardSession,
      registerScreen,
      playHand,
      claimReward,
    ]
  );

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

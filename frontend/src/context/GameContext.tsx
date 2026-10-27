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

import { practiceQuest } from "../data/quests";
import { findCampus, type CampusId } from "../data/campuses";
import { practiceStorageKey } from "../components/Tutorial/tutorialSteps";
import { getBattleRankReward, RANK_PROGRESS_VERSION, type BattleOutcome } from "../utils/hunterRank";
import { getRewardExp } from "../utils/questReward";
import { useStorageSync } from "./useStorageSync";
import {
  CAMPUS_STORAGE_KEY,
  clearLegacyBuildingSelection,
  clearMigratedLegacyGame,
  GAME_STORAGE_KEY,
  getCampusGameKey,
  getCampusLoadKey,
  loadSavedGame,
  readSelectedCampus,
  saveGame,
} from "../utils/gameStorage";
import { getCampusQuests, getMapAreas } from "../data/maps";
import type { Quest } from "../types/quest";
import { getFieldProgress, restoreFieldNoveltyIds } from "../utils/fieldProgress";
import { formatZenny, getCurrentWeapon, getNextWeapon, getRewardZenny, normalizeWeaponLevel, normalizeZenny, upgradeWeapon } from "../utils/weaponUpgrade";

export type Activity = {
  id: string;
  // craft は武器の強化（以前の武器の作成の履歴も同じ種類）
  type: "hunt" | "investigation" | "exchange" | "craft";
  title: string;
  detail: string;
  createdAt: string;
};

type GameState = {
  campusId: CampusId | null;
  quests: Quest[];
  // 持っているゼニー（クエストでもらい、武器の強化に使う）
  zenny: number;
  rank: number;
  rankExp: number;
  rankProgressVersion: number;
  // 武器を何段階強化したか（data/weapons.ts の WEAPONS の番号。0 は初期の武器）
  weaponLevel: number;
  obtainedFieldNoveltyIds: number[];
  activities: Activity[];
};

type GameContextType = GameState & {
  // 保存されているエリアを読み直す（練習中に選び直したときなど）
  reloadSelection: () => void;
  // 切り替えられなかったら false（保存できていない進み具合がある場合など）
  selectCampus: (campusId: CampusId) => boolean;
  requiresUpdate: boolean;
  canUpdateGame: () => boolean;
  resolveBattle: (
    questId: string,
    outcome: BattleOutcome,
    isGoldCrown?: boolean
  ) => void;
  // 武器を次の段階へ強化する。強化できなかったら false
  upgradeWeapon: () => boolean;
  // ステッカーの交換が成功したことを記録する（在庫の減算は API で行う）
  // 記録できなかったら false（新しいバージョンのデータがある場合など）
  claimFieldNovelty: (fieldId: number) => boolean;
};

const initialGameState: GameState = {
  campusId: null,
  quests: [],
  zenny: 0,
  rank: 0,
  rankExp: 0,
  rankProgressVersion: RANK_PROGRESS_VERSION,
  weaponLevel: 0,
  obtainedFieldNoveltyIds: [],
  activities: [],
};

// クエストの定義（手数・ステータス・EXP）は常に校舎のデータ（data/campuses）を使い、
// 保存データからは進行度（討伐済み・金冠・調査済み）だけを引き継ぐ。定義を変えてもキャッシュ削除が不要になる
// investigated を記録する前に調査したクエストは、履歴の「調査」から補う
function mergeQuestProgress(
  baseQuests: Quest[],
  savedQuests: GameState["quests"],
  activities: Activity[] = [],
): GameState["quests"] {
  const investigatedIds = new Set(
    (Array.isArray(activities) ? activities : [])
      .filter((activity) => activity?.type === "investigation")
      .map((activity) => baseQuests.find((quest) => String(activity.id).includes(`-${quest.id}-`))?.id)
      .filter(Boolean),
  );

  return baseQuests.map((quest) => {
    const saved = Array.isArray(savedQuests)
      ? savedQuests.find((item) => item?.id === quest.id)
      : undefined;

    return {
      ...quest,
      completed: saved?.completed === true,
      goldCrown: saved?.goldCrown === true,
      investigated: saved?.investigated === true || investigatedIds.has(quest.id),
    };
  });
}
// 校舎の初期状態。練習中は練習用のクエストも加える
function createCampusState(campusId: CampusId, practice: boolean): GameState {
  const campusQuests = getCampusQuests(campusId);

  return {
    ...initialGameState,
    campusId,
    quests: practice ? [practiceQuest, ...campusQuests] : campusQuests,
  };
}

// 保存データのゼニー・強化段階を、使える値にそろえる。
// 素材で武器を作っていたころのデータ（materials・weaponClaimed）は引き継がず、初期の武器・0z から始める
function normalizeWeaponState(saved: GameState) {
  return { zenny: normalizeZenny(saved.zenny), weaponLevel: normalizeWeaponLevel(saved.weaponLevel) };
}

// 以前あった建物選択の保存を消したか（ページを開いて最初の読み込みで1回だけ消す）
let legacyBuildingCleared = false;

// 進み具合は校舎ごとに保存する。campusId を省くと、選んでいる校舎（localStorage）を読む
function loadGameState(practiceCampus?: CampusId, campusOverride?: CampusId | null): GameState {
  if (typeof window === "undefined") {
    return initialGameState;
  }

  if (practiceCampus) {
    // 練習の狩猟で討伐しても調査になっても、次の段階へ強化できるゼニーになるようにしておく
    const defaults = {
      ...createCampusState(practiceCampus, true),
      zenny: Math.max(0, (getNextWeapon(0)?.upgradeCost ?? 0) - getRewardZenny("failure")),
    };

    try {
      const saved = loadSavedGame({ getItem: () => window.sessionStorage.getItem(practiceStorageKey) }, defaults);
      return {
        ...saved,
        ...normalizeWeaponState(saved),
        campusId: practiceCampus,
        quests: mergeQuestProgress(defaults.quests, saved.quests, saved.activities),
        obtainedFieldNoveltyIds: [],
      };
    } catch {
      return defaults;
    }
  }

  let campusId: CampusId | null = null;
  try {
    const storage = window.localStorage;
    // 以前あった建物選択の保存が残っていれば消す（読み込みのたびではなく、ページを開いて最初の1回だけ）
    if (!legacyBuildingCleared) {
      legacyBuildingCleared = true;
      clearLegacyBuildingSelection(storage);
    }
    campusId = campusOverride !== undefined
      ? campusOverride
      : findCampus(readSelectedCampus(storage))?.id ?? null;

    if (!campusId) return initialGameState;

    const defaults = createCampusState(campusId, false);
    const loadKey = getCampusLoadKey(storage, campusId);
    const saved = loadSavedGame(storage, defaults, loadKey);

    return {
      ...saved,
      ...normalizeWeaponState(saved),
      campusId,
      quests: mergeQuestProgress(defaults.quests, saved.quests, saved.activities),
      // 分ける前のデータのフィールド番号（1〜4）は今の号館の番号と意味が違い、ステッカーも別のものなので引き継がない
      obtainedFieldNoveltyIds: loadKey === GAME_STORAGE_KEY
        ? []
        : restoreFieldNoveltyIds(saved.obtainedFieldNoveltyIds, getMapAreas(campusId)),
    };
  } catch {
    // 読めなくても、選んでいる校舎は保つ（校舎選びの画面に戻さない）
    return campusId ? createCampusState(campusId, false) : initialGameState;
  }
}
function saveGameState(gameState: GameState, practiceCampus?: CampusId): boolean {
  try {
    if (practiceCampus) {
      window.sessionStorage.setItem(practiceStorageKey, JSON.stringify(gameState));
      return true;
    }
    // 校舎を選ぶ前は保存するものがない
    if (!gameState.campusId) return true;

    const storage = window.localStorage;
    const key = getCampusGameKey(gameState.campusId);
    if (
      gameState.rankProgressVersion > RANK_PROGRESS_VERSION
      || loadSavedGame(storage, initialGameState, key).rankProgressVersion > RANK_PROGRESS_VERSION
    ) return false;
    // 選んでいる校舎は、校舎を選んだときだけ書く（別タブで選んだ校舎を上書きしない）。
    // 分ける前のデータから引き継いだときは、まだ記録がないのでここで書く
    if (storage.getItem(CAMPUS_STORAGE_KEY) === null) {
      storage.setItem(CAMPUS_STORAGE_KEY, gameState.campusId);
    }
    // 同じ内容を別タブへ書き戻し続けないようにする。
    const saved = storage.getItem(key) === JSON.stringify(gameState)
      || saveGame(storage, gameState, key);
    if (saved) clearMigratedLegacyGame(storage, gameState.campusId);
    return saved;
  } catch {
    // ブラウザによっては localStorage 自体へのアクセスが拒否される。
    return false;
  }
}

const GameContext = createContext<GameContextType | null>(null);
export function GameProvider({ children, practiceCampus }: { children: ReactNode; practiceCampus?: CampusId }) {
  const [gameState, setGameState] = useState<GameState>(() => loadGameState(practiceCampus));

  const [saveFailed, setSaveFailed] = useState(false);
  const pendingSave = useRef<GameState | null>(null);
  const requiresUpdate = gameState.rankProgressVersion > RANK_PROGRESS_VERSION;
  // 操作直前の確認で、今の校舎の保存データを読み直すのに使う
  const campusRef = useRef(gameState.campusId);
  useEffect(() => {
    campusRef.current = gameState.campusId;
  }, [gameState.campusId]);

  // 保存されているエリアを読み直す。練習中に選び直したときも、
  // 練習を終えた画面が新しい選択を表示できるようにする
  const reloadSelection = useCallback(() => {
    setGameState(loadGameState());
  }, []);

  // 操作直前にも確認し、storage イベントが届く前の受取・交換を防ぐ。
  const canUpdateGame = useCallback(() => {
    if (practiceCampus) return true;
    if (requiresUpdate) return false;
    const latest = loadGameState(undefined, campusRef.current);
    if (latest.rankProgressVersion > RANK_PROGRESS_VERSION) {
      pendingSave.current = null;
      setSaveFailed(false);
      setGameState(latest);
      return false;
    }
    return true;
  }, [requiresUpdate, practiceCampus]);

  useEffect(() => {
    // 現在の状態を保存する前に、保存先のデータが新しい形式か確認する。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!canUpdateGame()) return;
    const saved = saveGameState(gameState, practiceCampus);
    pendingSave.current = saved ? null : gameState;
    // 保存の成否を画面に反映する。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaveFailed(!saved);
  }, [gameState, canUpdateGame, practiceCampus]);

  // 別タブで保存された進行度を反映し、古い状態で上書きしないようにする
  // 別タブで校舎を変えた場合も、表示に戻ったときに選んでいる校舎の進み具合を読み直す
  useStorageSync([gameState.campusId ? getCampusGameKey(gameState.campusId) : GAME_STORAGE_KEY, CAMPUS_STORAGE_KEY], () => {
    // 将来版を検出したら、未保存の旧形式データも書き戻さない。
    if (!canUpdateGame()) return;
    // 未保存の進行は保持し、同期で読み直す前に保存を再試行する。
    if (pendingSave.current) {
      const saved = saveGameState(pendingSave.current, practiceCampus);
      if (saved) pendingSave.current = null;
      setSaveFailed(!saved);
      return;
    }

    const next = loadGameState();

    // 中身が変わっていなければ何もしない（表示に戻るたびの再描画を防ぐ）
    setGameState((current) =>
      JSON.stringify(current) === JSON.stringify(next) ? current : next
    );
  }, !practiceCampus);

  const value = useMemo<GameContextType>(() => {
    const resolveBattle = (
      questId: string,
      outcome: BattleOutcome,
      isGoldCrown = false
    ) => {
      if (!canUpdateGame()) return;
      setGameState((current) => {
        if (current.rankProgressVersion > RANK_PROGRESS_VERSION) return current;
        const quest = current.quests.find((item) => item.id === questId);

        // 討伐済みでも周回で再討伐した分の報酬は受け取れる
        if (!quest) {
          return current;
        }

        const rewardZenny = getRewardZenny(outcome);
        // EXP はクエストごとの報酬（調査は3割）。ランクの上限処理は getBattleRankReward に任せる
        const { gainedExp, rank: nextRank, rankExp: nextExp } =
          getBattleRankReward(current.rankExp, getRewardExp(quest.id, outcome));
        const expDetail = `${formatZenny(rewardZenny)}・${gainedExp > 0 ? `経験値 +${gainedExp}` : "ハンターランク上限"}`;

        const activity: Activity = {
          id: `${Date.now()}-${questId}-${outcome}`,
          type: outcome === "victory" ? "hunt" : "investigation",
          title:
            outcome === "victory"
              ? `${quest.title}を討伐`
              : `${quest.title}を調査`,
          detail:
            outcome === "victory"
              ? `${expDetail}${isGoldCrown ? "・金冠を獲得" : ""}`
              : `落とし物を発見・${expDetail}`,
          createdAt: new Date().toISOString(),
        };

        return {
          ...current,
          quests: current.quests.map((item) => {
            if (item.id !== questId) return item;

            return outcome === "victory"
              ? { ...item, completed: true, goldCrown: item.goldCrown || isGoldCrown }
              : { ...item, investigated: true };
          }),
          zenny: current.zenny + rewardZenny,
          rank: nextRank,
          rankExp: nextExp,
          activities: [activity, ...current.activities],
        };
      });
    };

    const upgradeCurrentWeapon = () => {
      if (!canUpdateGame() || !upgradeWeapon(gameState)) return false;

      setGameState((current) => {
        if (current.rankProgressVersion > RANK_PROGRESS_VERSION) return current;
        const upgraded = upgradeWeapon(current);
        if (!upgraded) return current;

        const before = getCurrentWeapon(current.weaponLevel);
        const after = getCurrentWeapon(upgraded.weaponLevel);

        return {
          ...current,
          ...upgraded,
          activities: [
            {
              id: `${Date.now()}-weapon-upgrade-${upgraded.weaponLevel}`,
              type: "craft",
              title: `${after.name}に強化`,
              detail: `攻撃力 +${after.attackBonus - before.attackBonus}・${formatZenny(after.upgradeCost)}を使用`,
              createdAt: new Date().toISOString(),
            },
            ...current.activities,
          ],
        };
      });

      return true;
    };
    const claimFieldNovelty = (fieldId: number) => {
      const areas = getMapAreas(gameState.campusId);
      const area = areas.find((item) => item.id === fieldId);

      if (!area || !canUpdateGame() || !getFieldProgress(
        area, gameState.quests, gameState.obtainedFieldNoveltyIds, areas,
      ).redeemable) return false;
      setGameState((current) => {
        if (!getFieldProgress(area, current.quests, current.obtainedFieldNoveltyIds, areas).redeemable) return current;

        return {
          ...current,
          // フィールドの順に並べて保存する
          obtainedFieldNoveltyIds: restoreFieldNoveltyIds(
            [...current.obtainedFieldNoveltyIds, fieldId],
            areas,
          ),
          activities: [
            {
              id: `${Date.now()}-novelty-${fieldId}`,
              type: "exchange",
              title: `${area.novelty.name}を交換`,
              detail: `交換場所：${area.novelty.redemptionLocation}`,
              createdAt: new Date().toISOString(),
            },
            ...current.activities,
          ],
        };
      });

      return true;
    };
    // 校舎（エリア）を変えると、その校舎の進み具合に切り替える（進み具合は校舎ごとに別）
    const selectCampus = (campusId: CampusId) => {
      // 練習中はエリアを変えない（練習用の状態が本番の保存データに入れ替わったり、
      // 練習の状態が本番の保存先に書き込まれたりしないように）
      if (practiceCampus) return false;
      if (!canUpdateGame()) return false;
      // 保存できていない進み具合があれば、切り替える前に保存する（保存できなければ切り替えない）
      if (pendingSave.current) {
        if (!saveGameState(pendingSave.current)) return false;
        pendingSave.current = null;
      }
      try {
        window.localStorage.setItem(CAMPUS_STORAGE_KEY, campusId);
      } catch {
        // 保存できなくても、この画面では選んだ校舎で続ける
      }
      setGameState(loadGameState(undefined, campusId));
      return true;
    };
    return { ...gameState, reloadSelection, selectCampus, requiresUpdate, canUpdateGame, resolveBattle, upgradeWeapon: upgradeCurrentWeapon, claimFieldNovelty };
  }, [gameState, reloadSelection, requiresUpdate, canUpdateGame, practiceCampus]);

  return (
    <GameContext.Provider value={value}>
      {children}
      {requiresUpdate && (
        <div className="game-save-notice" role="alert">
          新しいバージョンの進行状況があります。続けるには再読み込みしてください。
          <button type="button" onClick={() => window.location.reload()}>再読み込み</button>
        </div>
      )}
      {saveFailed && !requiresUpdate && (
        <p className="game-save-notice" role="status">
          進行状況を保存できません。再読み込みすると進行状況が失われる場合があります。
        </p>
      )}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error("useGame must be used inside GameProvider");
  }

  return context;
}

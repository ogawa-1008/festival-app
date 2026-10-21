import { restoreRankState, type RankState } from "./hunterRank.ts";

// 校舎ごとに分ける前の保存先（今は古いデータの引き継ぎにだけ使う）
export const GAME_STORAGE_KEY = "monster-hunter-festival-game";
// 選んでいる校舎
export const CAMPUS_STORAGE_KEY = "monster-hunter-festival-campus";

// 進み具合は校舎ごとに分けて保存する
export function getCampusGameKey(campusId: string) {
  return `${GAME_STORAGE_KEY}:${campusId}`;
}

type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "setItem">;

export function loadSavedGame<T extends RankState>(storage: StorageReader, initial: T, key = GAME_STORAGE_KEY): T {
  try {
    const raw = storage.getItem(key);
    if (!raw) return initial;
    const saved: unknown = JSON.parse(raw);
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return initial;
    const data = saved as Record<string, unknown>;
    const restored = { ...initial };

    for (const key of Object.keys(initial) as (keyof T)[]) {
      if (data[key as string] != null) {
        restored[key] = data[key as string] as T[typeof key];
      }
    }

    const { rank, rankExp, rankProgressVersion } = restoreRankState(data);
    return { ...restored, rank, rankExp, rankProgressVersion };
  } catch {
    return initial;
  }
}

export function saveGame(storage: StorageWriter, state: RankState, key = GAME_STORAGE_KEY): boolean {
  try {
    storage.setItem(key, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function readLegacyCampusId(storage: StorageReader): string | null {
  try {
    const legacy: unknown = JSON.parse(storage.getItem(GAME_STORAGE_KEY) ?? "null");
    const campusId = (legacy as { campusId?: unknown } | null)?.campusId;
    return typeof campusId === "string" ? campusId : null;
  } catch {
    return null;
  }
}

// 選んでいる校舎。校舎ごとに分ける前のデータなら、そこに保存されていた校舎
export function readSelectedCampus(storage: StorageReader): string | null {
  try {
    return storage.getItem(CAMPUS_STORAGE_KEY) ?? readLegacyCampusId(storage);
  } catch {
    return null;
  }
}

// 校舎ごとの保存ができたら、その校舎の分だった分ける前のデータを消す（毎回読み直さないため）
export function clearMigratedLegacyGame(storage: StorageReader & Pick<Storage, "removeItem">, campusId: string) {
  try {
    if (readLegacyCampusId(storage) === campusId && storage.getItem(getCampusGameKey(campusId)) !== null) {
      storage.removeItem(GAME_STORAGE_KEY);
    }
  } catch {
    // 消せなくても、校舎ごとの保存を優先して読むので問題ない
  }
}

// 校舎の進み具合を読む場所。まだ校舎ごとの保存がなく、分ける前のデータがその校舎のものなら、そちらを引き継ぐ
export function getCampusLoadKey(storage: StorageReader, campusId: string) {
  const key = getCampusGameKey(campusId);
  try {
    if (storage.getItem(key) === null && readLegacyCampusId(storage) === campusId) {
      return GAME_STORAGE_KEY;
    }
  } catch {
    // 読めないときは校舎ごとの保存先を使う
  }
  return key;
}

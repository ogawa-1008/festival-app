import { restoreRankState, type RankState } from "./hunterRank.ts";

export const GAME_STORAGE_KEY = "monster-hunter-festival-game";

type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "setItem">;

export function loadSavedGame<T extends RankState>(storage: StorageReader, initial: T): T {
  try {
    const raw = storage.getItem(GAME_STORAGE_KEY);
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

export function saveGame(storage: StorageWriter, state: RankState): boolean {
  try {
    storage.setItem(GAME_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

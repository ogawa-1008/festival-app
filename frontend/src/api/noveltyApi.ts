// ノベルティ（ステッカー）の在庫 API。在庫はエリア（大阪・東京・名古屋）ごとで、号館では分けない
// 接続先は VITE_API_BASE_URL。未設定なら同じドメインの /api を使う（開発中は Vite の proxy で転送する）
// ※ 別のドメインを指定する場合は、API 側に CORS の設定が必要（今の API には無い）

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

// 失敗の理由。画面ではこれで案内を出し分ける
export type NoveltyApiError =
  | "out-of-stock" // 在庫切れ（409）
  | "not-found" // エリアが登録されていない（404）
  | "network" // 通信できなかった
  | "server"; // そのほかのサーバーのエラー

export type NoveltyApiResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: NoveltyApiError };

const toError = (status: number): NoveltyApiError =>
  status === 409 ? "out-of-stock" : status === 404 ? "not-found" : "server";

async function request<T>(
  path: string,
  init: RequestInit | undefined,
  pick: (body: unknown) => T | null,
): Promise<NoveltyApiResult<T>> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, init);
  } catch {
    return { ok: false, error: "network" };
  }

  if (!response.ok) return { ok: false, error: toError(response.status) };

  try {
    const value = pick(await response.json());

    return value === null ? { ok: false, error: "server" } : { ok: true, value };
  } catch {
    return { ok: false, error: "server" };
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

// レスポンスから残り数（0 以上の整数）を取り出す
const toRemaining = (value: unknown): number | null =>
  isRecord(value) && Number.isInteger(value.remaining) && (value.remaining as number) >= 0
    ? (value.remaining as number)
    : null;

// エリアの残り数
export function fetchNoveltyStock(campusId: string) {
  return request(`/api/campuses/${encodeURIComponent(campusId)}/novelty`, undefined, toRemaining);
}

// エリアの在庫を1つ減らして交換する。成功したら交換後の残り数を返す
export function redeemNovelty(campusId: string) {
  return request(
    `/api/campuses/${encodeURIComponent(campusId)}/novelty/redeem`,
    { method: "POST" },
    toRemaining,
  );
}

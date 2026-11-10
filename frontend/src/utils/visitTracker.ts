// 来場者数（UU）の集計。アプリを開いたら、端末ごとのランダムな ID を1日1回だけ API に送る
// （名前・IP などの個人につながる情報は送らない。数えるのは API の DB で、phpMyAdmin で集計する）
import { API_BASE_URL } from "../api/apiBase.ts";

// 端末ごとの ID と、最後に送った日（日本時間の YYYY-MM-DD）
export const VISITOR_ID_KEY = "monster-hunter-festival-visitor-id";
export const VISIT_SENT_DATE_KEY = "monster-hunter-festival-visit-sent";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

type VisitStorage = Pick<Storage, "getItem" | "setItem">;
type VisitFetch = (url: string, init: RequestInit) => Promise<Pick<Response, "ok">>;

// 日本時間の日付。API も日本時間で日付を決めるので、端末の時計の地域がちがっても日がずれない
export function toJstDate(now: Date) {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// ランダムな ID（UUID v4）。randomUUID は https でしか使えないため、ないときは getRandomValues で作る
// （同じ Wi-Fi のスマホから http で開いて確かめるときも送れるように）
export function createVisitorId(cryptoApi: Pick<Crypto, "getRandomValues"> & Partial<Pick<Crypto, "randomUUID">> = crypto) {
  if (typeof cryptoApi.randomUUID === "function") return cryptoApi.randomUUID();

  const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

type TrackVisitOptions = {
  storage?: VisitStorage;
  fetcher?: VisitFetch;
  now?: Date;
  createId?: () => string;
};

// 今日の分をまだ送っていなければ送る。送れたら、その日は送らない（失敗したら次に開いたときに送り直す）
// 端末に保存できない（ブラウザの設定で止めているなど）ときは送らない。開くたびに別の人として数えてしまうため
export async function trackVisit({
  storage: givenStorage,
  fetcher = fetch,
  now = new Date(),
  createId = createVisitorId,
}: TrackVisitOptions = {}): Promise<"sent" | "skipped" | "failed"> {
  const today = toJstDate(now);
  let storage: VisitStorage;
  let visitorId: string;

  try {
    // localStorage は、見るだけで例外になるブラウザの設定がある（Cookie をすべてブロックしているなど）
    storage = givenStorage ?? window.localStorage;
    if (storage.getItem(VISIT_SENT_DATE_KEY) === today) return "skipped";

    const saved = storage.getItem(VISITOR_ID_KEY);
    visitorId = saved && UUID_PATTERN.test(saved) ? saved : createId();
    if (visitorId !== saved) {
      storage.setItem(VISITOR_ID_KEY, visitorId);
      // 保存できたか確かめる（保存できないのに送ると、開くたびに新しい ID になる）
      if (storage.getItem(VISITOR_ID_KEY) !== visitorId) return "skipped";
    }
  } catch {
    return "skipped";
  }

  try {
    const response = await fetcher(`${API_BASE_URL}/api/visits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId }),
      keepalive: true,
    });
    if (!response.ok) return "failed";
  } catch {
    return "failed";
  }

  try {
    storage.setItem(VISIT_SENT_DATE_KEY, today);
  } catch {
    // 記録できなくても、同じ日の2回目は API 側で数えない
  }
  return "sent";
}

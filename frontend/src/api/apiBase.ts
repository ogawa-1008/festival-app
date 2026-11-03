// API の接続先。VITE_API_BASE_URL が未設定なら同じドメインの /api を使う（開発中は Vite の proxy で転送する）
// ※ 別のドメインを指定する場合は、API 側に CORS の設定が必要（今の API には無い）
export const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

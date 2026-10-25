// 会場のQRコードの中身。標準カメラでも開けるよう、アプリのURL（https://ドメイン/q/QUEST_OSAKA_1）にする。
// アプリ内カメラでは、URL でも文字列（QUEST_OSAKA_1）でも、末尾のクエストの文字列を取り出して使う

// 標準カメラで開いたときの受け口のパス
export const QUEST_QR_PATH = "/q/";

// QRコードの中身から、クエストの文字列（QUEST_OSAKA_1 など）を取り出す。
// ドメインは問わない（手元・プレビュー・本番のどこで作ったQRでも読めるように）。
// /q/ の形でない URL など、クエストの文字列が取り出せなければ null
export function parseQuestQr(text: string): string | null {
  const value = text.trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    try {
      const { pathname } = new URL(value);
      return pathname.startsWith(QUEST_QR_PATH) ? readCode(pathname.slice(QUEST_QR_PATH.length)) : null;
    } catch {
      return null;
    }
  }

  // 以前のQR（文字列だけ）
  return readCode(value);
}

function readCode(raw: string) {
  try {
    const code = decodeURIComponent(raw.replace(/\/$/, ""));
    return /^[A-Za-z0-9_-]+$/.test(code) ? code : null;
  } catch {
    return null;
  }
}

// 会場に貼るQRコードの中身（URL）を作る。baseUrl は本番のアプリの URL（https://example.com など）
export function buildQuestQrUrl(baseUrl: string, code: string) {
  return `${baseUrl.replace(/\/+$/, "")}${QUEST_QR_PATH}${encodeURIComponent(code)}`;
}

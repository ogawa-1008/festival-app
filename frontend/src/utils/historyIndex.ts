// 今の画面が、ブラウザの履歴の何番目か
// React Router（BrowserRouter）が history.state に入れている idx を読む。公開された使い方ではないため、
// 読めないとき（ルーターの仕様が変わったときなど）は undefined を返す。
// 使う側は、undefined のときも困らない動き（ホームへ進むなど）にしておくこと
export function getHistoryIndex(): number | undefined {
  if (typeof window === "undefined") return undefined;
  const idx = (window.history.state as { idx?: unknown } | null)?.idx;
  return typeof idx === "number" ? idx : undefined;
}

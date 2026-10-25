import { createContext, useContext } from "react";

// 標準カメラで開いたQRが、ほかのエリアのもの・クエスト用でないものだったときにホームで出す案内
export const QrNoticeContext = createContext<{
  qrNotice: string | null;
  setQrNotice: (message: string | null) => void;
} | null>(null);

export function useQrNotice() {
  const value = useContext(QrNoticeContext);
  if (!value) throw new Error("QrNoticeProvider is required");
  return value;
}

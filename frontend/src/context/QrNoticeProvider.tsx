import { useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

import { QrNoticeContext } from "./qrNotice";

// 案内は画面の状態として持つ（履歴に残さない）ので、再読み込みや「戻る」で再び出ることはない。
// ホームから別の画面へ移ったら消す
export function QrNoticeProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [qrNotice, setQrNotice] = useState<string | null>(null);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    if (prevPathname === "/") setQrNotice(null);
  }

  const value = useMemo(() => ({ qrNotice, setQrNotice }), [qrNotice]);
  return <QrNoticeContext.Provider value={value}>{children}</QrNoticeContext.Provider>;
}

import { useEffect, useRef } from "react";

// 別タブで localStorage の key が更新されたとき・タブが表示に戻ったときに onSync を呼ぶ
// （スマホでは背景タブの storage イベントが遅れるため、表示に戻った時点でも読み直す）
export function useStorageSync(key: string | string[], onSync: () => void, enabled = true) {
  const keys = (Array.isArray(key) ? key : [key]).join("\n");
  const onSyncRef = useRef(onSync);

  useEffect(() => {
    onSyncRef.current = onSync;
  });

  useEffect(() => {
    if (!enabled) return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== null && !keys.split("\n").includes(event.key)) return;

      onSyncRef.current();
    };

    const handleVisible = () => {
      if (document.visibilityState === "visible") {
        onSyncRef.current();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("pageshow", handleVisible);
    window.addEventListener("focus", handleVisible);
    document.addEventListener("visibilitychange", handleVisible);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("pageshow", handleVisible);
      window.removeEventListener("focus", handleVisible);
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, [keys, enabled]);
}

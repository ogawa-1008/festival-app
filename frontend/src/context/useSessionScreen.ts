import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useBattleSession } from "./BattleSessionContext";

export const SESSION_CONFLICT_MESSAGE =
  "別のタブでバトル中、またはリザルト画面を開いています。\n前回のバトルを破棄して、新しくバトルを始めますか？";

// バトル・リザルト画面の入場チェック。別タブで開いていれば破棄するか確認する
// 確認が済み、画面を表示してよくなったら true を返す
export function useSessionScreen(questId: string | undefined) {
  const navigate = useNavigate();
  const { takenOver, checkAccess, discardSession, registerScreen } =
    useBattleSession();

  const [isReady, setIsReady] = useState(false);

  useEffect(() => registerScreen(), [registerScreen]);

  useEffect(() => {
    // StrictMode の二重実行や画面遷移で古い確認を出さないためのフラグ
    let cancelled = false;

    void checkAccess(questId).then((access) => {
      if (cancelled) return;

      if (access === "ok") {
        setIsReady(true);
        return;
      }

      if (window.confirm(SESSION_CONFLICT_MESSAGE)) {
        discardSession();
        navigate("/qr-scanner", {
          replace: true,
          state: { message: "QRコードを読み取って新しくバトルを開始してください" },
        });
      } else {
        navigate("/", { replace: true });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [questId, checkAccess, discardSession, navigate]);

  // 別タブで新しいバトルが始まったら、このタブの画面はホームへ戻す
  useEffect(() => {
    if (takenOver) {
      navigate("/", { replace: true });
    }
  }, [takenOver, navigate]);

  return isReady && !takenOver;
}

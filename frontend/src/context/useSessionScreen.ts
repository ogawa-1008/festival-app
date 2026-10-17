import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useBattleSession } from "./BattleSessionContext";

// "checking": 確認中 / "ready": 表示してよい / "elsewhere": 別タブで開いているので表示しない
type ScreenStatus = "checking" | "ready" | "elsewhere";

// バトル・リザルト画面の入場チェック
// 別タブで開いている場合は確認を出さずに弾く（破棄の確認はQR読み取り後に行う）
export function useSessionScreen(questId: string | undefined): ScreenStatus {
  const navigate = useNavigate();
  const { takenOver, checkAccess, registerScreen } = useBattleSession();

  const [status, setStatus] = useState<ScreenStatus>("checking");

  useEffect(() => registerScreen(), [registerScreen]);

  useEffect(() => {
    // StrictMode の二重実行や画面遷移で古い結果を反映しないためのフラグ
    let cancelled = false;

    void checkAccess(questId).then((access) => {
      if (!cancelled) {
        setStatus(access === "ok" ? "ready" : "elsewhere");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [questId, checkAccess]);

  // 別タブで新しいバトルが始まったら、このタブの画面はホームへ戻す
  useEffect(() => {
    if (takenOver) {
      navigate("/", { replace: true });
    }
  }, [takenOver, navigate]);

  return takenOver ? "checking" : status;
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { isOwnedByThisTab, useBattleSession } from "./BattleSessionContext";

// "checking": 確認中 / "ready": 表示してよい / "elsewhere": 別タブで開いているので表示しない
type ScreenStatus = "checking" | "ready" | "elsewhere";

// バトル・リザルト画面の入場チェック
// 別タブで開いている場合は確認を出さずに弾く（破棄の確認はQR読み取り後に行う）
export function useSessionScreen(questId: string | undefined): ScreenStatus {
  const navigate = useNavigate();
  const { session, takenOver, checkAccess, registerScreen } =
    useBattleSession();

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

  // 未受け取りのバトル・リザルトを別タブが持っている（引き継がれた）か
  const isHeldElsewhere =
    status === "ready" &&
    session !== null &&
    session.questId === questId &&
    !session.claimed &&
    !isOwnedByThisTab(session);

  // 別タブに引き継がれたら、このタブの画面はホームへ戻す（同じ画面を2つのタブで開かせない）
  useEffect(() => {
    if (takenOver || isHeldElsewhere) {
      navigate("/", { replace: true });
    }
  }, [takenOver, isHeldElsewhere, navigate]);

  return takenOver || isHeldElsewhere ? "checking" : status;
}

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { isOwnedByThisTab, useBattleSession } from "./BattleSessionContext";

// "checking": 遷移待ち / "ready": 表示してよい / "elsewhere": 別タブのセッションなので表示しない
type ScreenStatus = "checking" | "ready" | "elsewhere";

// バトル・リザルト画面の入場チェック
// 別タブのセッションは確認を出さずに弾く（引き継ぎの確認はQR読み取り後に行う）
export function useSessionScreen(questId: string | undefined): ScreenStatus {
  const navigate = useNavigate();
  const { session, takenOver, checkAccess, registerScreen } =
    useBattleSession();

  useEffect(() => registerScreen(), [registerScreen]);

  // session が変わるたびに判定し直す（localStorage の最新値で判定する）
  const status: ScreenStatus =
    checkAccess(questId) === "ok" ? "ready" : "elsewhere";

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

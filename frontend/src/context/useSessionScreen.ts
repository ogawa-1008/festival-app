import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { isOwnedByThisTab, useBattleSession } from "./BattleSessionContext";

// "checking": 遷移待ち / "ready": 表示してよい / "elsewhere": 別タブのセッションなので表示しない
type ScreenStatus = "checking" | "ready" | "elsewhere";

// バトル・リザルト画面の入場チェック
// 別タブのセッションは確認を出さずに弾く（引き継ぎの確認はQR読み取り後に行う）
export function useSessionScreen(questId: string | undefined): ScreenStatus {
  const navigate = useNavigate();
  const { session, takenOver, registerScreen } = useBattleSession();

  useEffect(() => registerScreen(), [registerScreen]);

  // 別タブに引き継がれたら、このタブの画面はホームへ戻す（同じ画面を2つのタブで開かせない）
  useEffect(() => {
    if (takenOver) {
      navigate("/", { replace: true });
    }
  }, [takenOver, navigate]);

  if (takenOver) {
    return "checking";
  }

  // 未受け取りのバトル・リザルトを別タブが持っていれば表示しない
  // セッションなし・別クエスト・受け取り済みは各画面の判定に任せる
  const isHeldElsewhere =
    session !== null &&
    session.questId === questId &&
    !session.claimed &&
    !isOwnedByThisTab(session);

  return isHeldElsewhere ? "elsewhere" : "ready";
}

import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useGameTutorial } from "../../components/Tutorial/useGameTutorial";
import { useGame } from "../../context/GameContext";
import { useStartQuestFromQr } from "../../context/useStartQuestFromQr";
import { parseQuestQr } from "../../utils/questQr";

// スマホの標準カメラで会場のQRコード（https://ドメイン/q/QUEST_OSAKA_1）を開いたときの受け口。
// エリアを選んでいれば、アプリ内カメラで読んだときと同じようにそのクエストへ進む。
// エリアを選んでいなければ、アプリを開くだけ（クエストには進まず、エリアを選ぶ画面へ）
function QrEntry() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { campusId } = useGame();
  const { active: practice } = useGameTutorial();
  const { lookup, start } = useStartQuestFromQr();
  // 開発時の StrictMode などで2回動いても、対戦を2回始めないようにする
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    // エリアを選んでいない・操作の練習中は、ホームを開くだけ（この画面は履歴に残さない）
    if (!campusId || practice) {
      navigate("/", { replace: true });
      return;
    }

    const found = lookup(parseQuestQr(code ?? ""));
    if (found.kind === "quest") {
      start(found.quest, { replace: true });
    } else {
      // ほかのエリアのQR・クエスト用ではないQRは、ホームで理由を伝える
      navigate("/", { replace: true, state: { qrNotice: found.message } });
    }
  }, [campusId, practice, code, lookup, start, navigate]);

  return null;
}

export default QrEntry;

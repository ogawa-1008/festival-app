import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { useGameTutorial } from "../components/Tutorial/useGameTutorial";
import { findCampus } from "../data/campuses";
import { allCampusQuests } from "../data/maps";
import { quests as allQuests } from "../data/quests";
import type { Quest } from "../types/quest";
import { getBattleStats } from "../utils/battleStats";
import { useBattleSession } from "./BattleSessionContext";
import { useGame } from "./GameContext";

const getTakeOverMessage = (title: string) =>
  `別のタブで開いていた「${title}」のバトル・リザルトがあります。\nこのタブで続きから引き継ぎますか？`;

const getDiscardMessage = (title: string, isElsewhere: boolean) =>
  `${isElsewhere ? "別のタブで開いていた" : ""}「${title}」のバトルが途中です。\nこのバトルを破棄して、新しくバトルを始めますか？`;

// QRコードのクエストの文字列を調べた結果
export type QrLookup =
  | { kind: "quest"; quest: Quest }
  // ほかのエリアのクエスト
  | { kind: "other-campus"; message: string }
  | { kind: "unknown"; message: string };

// QRコードからクエストを始める処理（アプリ内カメラと、標準カメラで開いたときの受け口で共通）
export function useStartQuestFromQr() {
  const navigate = useNavigate();
  const { active: practice, advance } = useGameTutorial();
  const { startBattle } = useBattleSession();
  const { weaponLevel, quests } = useGame();

  // カメラの読み取り処理は起動したときの関数を使い続けるため、読み取った時点の値を使えるよう最新値を持つ
  // （カメラ起動後に別タブで武器を交換した・練習を終えた場合など）
  const latest = useRef({ weaponLevel, quests, practice, advance });
  useEffect(() => {
    latest.current = { weaponLevel, quests, practice, advance };
  }, [weaponLevel, quests, practice, advance]);

  // 選んでいるエリアのクエストから探す（練習中は練習用のクエストも）
  const lookup = useCallback((code: string | null): QrLookup => {
    const quest = code ? latest.current.quests.find((item) => item.qrCode === code) : undefined;
    if (quest) return { kind: "quest", quest };

    // ほかのエリアのQRなら、どのエリアのものかを伝える
    const otherCampus = findCampus(allCampusQuests.find((item) => item.quest.qrCode === code)?.campusId ?? null);
    return otherCampus
      ? { kind: "other-campus", message: `このQRコードは${otherCampus.name}のクエストです。選んでいるエリアのQRコードを読み取ってください` }
      : { kind: "unknown", message: "このQRコードはクエスト用ではありません" };
  }, []);

  // QRを読み取った証拠として対戦を始め、確認画面（受け取り前の結果があればリザルト）へ進む。
  // replace：今の画面を履歴に残さない。始めなかった（確認で「キャンセル」）ときは false
  const start = useCallback((quest: Quest, options: { replace?: boolean } = {}) => {
    // 交換済みの武器を反映した、このバトルのステータス
    const stats = getBattleStats(quest, { weaponLevel: latest.current.weaponLevel });
    let result = startBattle(quest.id, stats);

    // 別タブのセッション・別クエストが戦闘中の場合は確認する
    if (result.type === "confirm") {
      const previousId = result.questId;
      const title = allQuests.find((item) => item.id === previousId)?.title ?? "前回のクエスト";
      const message = result.mode === "takeover"
        ? getTakeOverMessage(title)
        : getDiscardMessage(title, result.isElsewhere);

      if (!window.confirm(message)) {
        navigate("/", { replace: options.replace });
        return false;
      }

      result = startBattle(quest.id, stats, { force: true });
    }

    if (result.type === "result") {
      const pendingTitle = allQuests.find((item) => item.id === result.questId)?.title;

      // 別クエストのQRを読んだのに前のリザルトへ進む理由を伝える
      navigate(`/result/${result.questId}`, {
        replace: options.replace,
        state: result.questId !== quest.id && pendingTitle
          ? { notice: `「${pendingTitle}」の報酬を受け取ってから、次のバトルを始められます` }
          : null,
      });
    } else {
      const { practice, advance } = latest.current;
      if (practice) advance("qr-scanned");
      navigate(`/quest-loading/${quest.id}`, { replace: options.replace || practice });
    }
    return true;
  }, [startBattle, navigate]);

  return { lookup, start };
}

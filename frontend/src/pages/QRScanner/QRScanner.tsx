import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useLocation, useNavigate } from "react-router-dom";

import { useBattleSession } from "../../context/BattleSessionContext";
import { findCampus } from "../../data/campuses";
import { allCampusQuests, getMapAreas } from "../../data/maps";
import { quests as allQuests } from "../../data/quests";
import { useGame } from "../../context/GameContext";
import { getBattleStats } from "../../utils/battleStats";
import {
  classifyCameraError,
  classifyEnvironment,
  classifyPermissionDenied,
  detectPlatform,
  getCameraErrorContent,
  isPermissionError,
  type CameraErrorKind,
} from "../../utils/cameraError";
import { useGameTutorial } from "../../components/Tutorial/useGameTutorial";

import "./QRScanner.css";

const getTakeOverMessage = (title: string) =>
  `別のタブで開いていた「${title}」のバトル・リザルトがあります。\nこのタブで続きから引き継ぎますか？`;

const getDiscardMessage = (title: string, isElsewhere: boolean) =>
  `${isElsewhere ? "別のタブで開いていた" : ""}「${title}」のバトルが途中です。\nこのバトルを破棄して、新しくバトルを始めますか？`;

const SCAN_SETTINGS = {
  fps: 10,
  qrbox: {
    width: 220,
    height: 220,
  },
};

const getCameraEnvironment = () => ({
  userAgent: navigator.userAgent,
  isSecureContext: window.isSecureContext,
  hasMediaDevices: Boolean(navigator.mediaDevices?.getUserMedia),
});

// カメラが使えなかった原因。fromPermission は権限が原因か（許可し直したら案内を閉じる）
type CameraError = {
  kind: CameraErrorKind;
  fromPermission: boolean;
};

// https でない・カメラの機能がないことは、カメラを起動する前から分かる
const getInitialCameraError = (): CameraError | null => {
  const kind = classifyEnvironment(getCameraEnvironment());

  return kind ? { kind, fromPermission: false } : null;
};

function QRScanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { active: practice, step, questId: practiceQuestId, advance } = useGameTutorial();

  const { startBattle } = useBattleSession();
  const { weaponClaimed, quests, campusId, selectBuilding } = useGame();

  // カメラ起動後に別タブで武器を交換しても、読み取った時点の値を使えるよう最新値を持つ
  const weaponClaimedRef = useRef(weaponClaimed);
  // 読み取れるのは選んでいる校舎のクエストだけ（練習中は練習用のクエストも）
  const questsRef = useRef(quests);

  useEffect(() => {
    weaponClaimedRef.current = weaponClaimed;
    questsRef.current = quests;
  }, [weaponClaimed, quests]);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);
  const isStartingRef = useRef(false);

  const [isScanning, setIsScanning] =
    useState(practice && step === "scan");

  // バトル画面から差し戻された場合はその理由を表示する
  const [errorMessage, setErrorMessage] =
    useState(
      () =>
        (location.state as { message?: string } | null)?.message ?? ""
    );

  // カメラが使えなかった原因（null のときは使える・未確認）
  const [cameraError, setCameraError] =
    useState<CameraError | null>(() => practice ? null : getInitialCameraError());

  // 案内は1回だけ表示する（再読み込み・戻る操作で古い案内が出ないよう履歴から消す）
  useEffect(() => {
    if (location.state) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  const stopScanner = async () => {
    const scanner = scannerRef.current;

    scannerRef.current = null;

    if (!scanner) {
      return;
    }

    try {
      await scanner.stop();
    } catch {
      // すでに停止済みの場合は何もしない
    }

    try {
      await scanner.clear();
    } catch {
      // アンマウント後に要素が消えていても問題ない
    }
  };

  // 最新の権限の状態（許可しているのに起動できなかった場合の判定に使う）
  const permissionStateRef = useRef<PermissionState | null>(null);

  // 以前にカメラを拒否していることが分かる端末では、画面を開いた時点で許可し直す方法を案内する
  // 設定から許可し直して戻ってきたら、案内を閉じる
  useEffect(() => {
    if (practice) return;
    let status: PermissionStatus | null = null;
    let cancelled = false;

    const apply = () => {
      if (!status || cancelled) return;

      permissionStateRef.current = status.state;

      if (status.state === "denied") {
        // 読み取りの途中で取り消された場合も、止めて案内を出す
        void stopScanner();
        setIsScanning(false);
        setCameraError(
          (current) =>
            current ?? {
              kind: classifyPermissionDenied(navigator.userAgent),
              fromPermission: true,
            }
        );
      } else {
        // 許可・確認（毎回たずねる）に戻ったら試せるので、権限が原因の案内だけ閉じる
        setCameraError((current) => (current?.fromPermission ? null : current));
      }
    };

    navigator.permissions
      ?.query({ name: "camera" as PermissionName })
      .then((result) => {
        // 問い合わせ中に画面を離れていたら、監視を登録しない
        if (cancelled) return;

        status = result;
        apply();
        result.addEventListener("change", apply);
      })
      .catch(() => {
        // camera の権限を問い合わせられないブラウザ（古い iPhone など）は、起動に失敗してから案内する
      });

    return () => {
      cancelled = true;
      status?.removeEventListener("change", apply);
    };
  }, [practice]);

  // QRコードを読み取れたとき
  const handleScanSuccess = (decodedText: string) => {
    if (hasScannedRef.current) {
      return;
    }

    const quests = questsRef.current;
    const quest = quests.find(
      (item) =>
        item.qrCode === decodedText
    );

    if (quest) {
      hasScannedRef.current = true;
      setIsScanning(false);

      // 会場のQRコードは、その校舎にいる証拠。選んでいる校舎を読み取った場所に合わせる
      const area = getMapAreas(campusId).find((item) => item.questIds.includes(quest.id));
      if (area) selectBuilding(area.id);

      // 交換済みの武器を反映した、このバトルのステータス
      const stats = getBattleStats(quest, {
        weaponClaimed: weaponClaimedRef.current,
      });

      // QRを読み取った証拠としてバトルセッションを開始する
      let start = startBattle(quest.id, stats);

      // 別タブのセッション・別クエストが戦闘中の場合は確認する
      if (start.type === "confirm") {
        const previousId = start.questId;
        const title =
          allQuests.find((item) => item.id === previousId)?.title
            ?? "前回のクエスト";
        const message = start.mode === "takeover"
          ? getTakeOverMessage(title)
          : getDiscardMessage(title, start.isElsewhere);

        if (!window.confirm(message)) {
          navigate("/");
          void stopScanner();
          return;
        }

        start = startBattle(quest.id, stats, { force: true });
      }

      // カメラの停止完了を待つと、端末によっては
      // 映像だけが黒いまま遷移しないことがある。
      if (start.type === "result") {
        const pendingTitle =
          allQuests.find((item) => item.id === start.questId)?.title;

        // 別クエストのQRを読んだのに前のリザルトへ進む理由を伝える
        navigate(`/result/${start.questId}`, {
          state: start.questId !== quest.id && pendingTitle
            ? {
                notice: `「${pendingTitle}」の報酬を受け取ってから、次のバトルを始められます`,
              }
            : null,
        });
      } else {
        if (practice) advance("qr-scanned");
        navigate(`/quest-loading/${quest.id}`, { replace: practice });
      }
      void stopScanner();
    } else {
      // ほかの校舎のQRなら、どの校舎のものかを伝える
      const otherCampus = findCampus(
        allCampusQuests.find((item) => item.quest.qrCode === decodedText)?.campusId ?? null,
      );
      setErrorMessage(
        otherCampus
          ? `このQRコードは${otherCampus.name}のクエストです。選んでいるエリアのQRコードを読み取ってください`
          : "このQRコードはクエスト用ではありません"
      );
    }

  };

  // カメラを起動する。起動中に画面を離れたり止められたりしていたら、起動したカメラを止める
  // （背面カメラの指定は「できれば背面」の扱いなので、背面がない端末では前面カメラが使われる）
  const startScanner = async () => {
    const scanner = new Html5Qrcode("qr-reader");

    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        SCAN_SETTINGS,
        handleScanSuccess,
        () => {
          // QRコードをまだ認識していない場合
        }
      );
    } catch (error) {
      // 起動中に画面を離れていたら、後片付けだけして案内は出さない
      if (scannerRef.current !== scanner) {
        try {
          await scanner.clear();
        } catch {
          // すでに片付いていれば何もしない
        }

        return false;
      }

      throw error;
    }

    if (scannerRef.current !== scanner) {
      try {
        await scanner.stop();
        await scanner.clear();
      } catch {
        // すでに止まっていれば何もしない
      }

      return false;
    }

    return true;
  };

  const startCamera = async () => {
    if (practice) { setIsScanning(true); advance("camera-start"); return; }
    if (isStartingRef.current || scannerRef.current) {
      return;
    }

    isStartingRef.current = true;

    try {
      setErrorMessage("");
      hasScannedRef.current = false;

      // 結果が出るまでは今の案内を出したままにする（「カメラを起動」の画面が一瞬出ないように）
      if (await startScanner()) {
        setCameraError(null);
        setIsScanning(true);
      }
    } catch (error) {
      console.error(
        "Camera error:",
        error
      );

      // 許可しているのに同じエラーが出た場合は、映像の再生がブロックされた（低電力モードなど）とみなす
      const fromPermission =
        isPermissionError(error) && permissionStateRef.current !== "granted";

      setCameraError({
        kind: fromPermission || !isPermissionError(error)
          ? classifyCameraError(error, getCameraEnvironment())
          : "unknown",
        fromPermission,
      });
      await stopScanner();
    } finally {
      isStartingRef.current = false;
    }
  };

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, []);

  const cameraErrorContent = cameraError
    ? getCameraErrorContent(
      cameraError.kind,
      detectPlatform(navigator.userAgent, navigator.maxTouchPoints)
    )
    : null;

  return (
    <main className="qr-scanner-page">

      <header className="qr-header">
        <button
          type="button"
          className="qr-back-button"
          onClick={() => navigate("/")}
        >
          ←
        </button>

        <h1>クエスト</h1>
      </header>

      <section className="qr-description">
        <p>
          QRコードを読み取って
          <br />
          クエストを進行させよう
        </p>
      </section>

      <section className="qr-camera-section">
        <div className="qr-camera-frame" data-tutorial="qr-camera">

          <div
            id="qr-reader"
            className="qr-reader"
          />

          {!isScanning && cameraErrorContent && (
            <div className="qr-camera-error" role="alert">
              <h2>{cameraErrorContent.title}</h2>

              <p>{cameraErrorContent.message}</p>

              {cameraErrorContent.steps.length > 0 && (
                <ol>
                  {cameraErrorContent.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              )}

              {cameraErrorContent.canRetry && (
                <button
                  type="button"
                  className="qr-start-button"
                  onClick={startCamera}
                >
                  もう一度試す
                </button>
              )}

              <p className="qr-camera-error-help">
                解決しないときは、近くのスタッフに声をかけてください。
              </p>
            </div>
          )}

          {!isScanning && !cameraErrorContent && (
            <div className="qr-start-screen">
              <div className="qr-camera-icon">
                📷
              </div>

              <p>
                QRコードを読み取るには
                <br />
                カメラを起動してください
              </p>

              <button
                type="button"
                className="qr-start-button"
                data-tutorial="camera-start"
                onClick={startCamera}
              >
                カメラを起動
              </button>
            </div>
          )}
          {practice && isScanning && (
            <div className="qr-practice-preview">
              <span>操作の練習</span>
              <button type="button" className="qr-practice-code" data-tutorial="practice-scan"
                onClick={() => handleScanSuccess(quests.find((quest) => quest.id === practiceQuestId)!.qrCode)}>
                <svg viewBox="0 0 21 21" aria-hidden="true">
                  <rect width="21" height="21" fill="#f7edd3" />
                  <path fill="currentColor" fillRule="evenodd" d="M1 1h7v7H1zM2 2v5h5V2zM13 1h7v7h-7zM14 2v5h5V2zM1 13h7v7H1zM2 14v5h5v-5z" />
                  <path fill="currentColor" d="M3 3h3v3H3zM15 3h3v3h-3zM3 15h3v3H3zM10 1h1v4h-1zM9 7h3v3H9zM1 10h4v1H1zM6 9h2v3H6zM10 12h3v2h-3zM14 10h6v2h-6zM9 16h2v4H9zM12 15h3v3h-3zM16 14h4v2h-4zM16 18h2v2h-2zM19 17h1v3h-1zM12 19h3v1h-3z" />
                </svg>
                <strong>練習用QRを読み取る</strong>
              </button>
              <p>本番では会場のQRを枠に合わせます</p>
            </div>
          )}

          <span className="corner top-left" />
          <span className="corner top-right" />
          <span className="corner bottom-left" />
          <span className="corner bottom-right" />

        </div>

      </section>

      {/* 案内を出しているときは、食い違わないよう下の説明を出さない */}
      {!cameraErrorContent && (
        <p className="qr-guide">
          {isScanning
            ? "QRコードを枠の中に合わせてください"
            : "カメラを起動してQRコードを読み取ります"}
        </p>
      )}

      {errorMessage && (
        <p className="qr-error">
          {errorMessage}
        </p>
      )}

    </main>
  );
}

export default QRScanner;

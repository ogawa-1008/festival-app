import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from "react-router-dom";

import { quests } from "../../data/quests";
import { useGameTutorial } from "../../components/Tutorial/useGameTutorial";

import "./QRScanner.css";

function QRScanner() {
  const navigate = useNavigate();
  const { active: practice, step, questId: practiceQuestId, advance } = useGameTutorial();

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);
  const isStartingRef = useRef(false);

  const [isScanning, setIsScanning] =
    useState(practice && step === "scan");

  const [errorMessage, setErrorMessage] =
    useState("");

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

  const startCamera = async () => {
    if (practice) {
      setIsScanning(true);
      advance("camera-start");
      return;
    }
    if (isStartingRef.current || scannerRef.current) {
      return;
    }

    isStartingRef.current = true;

    try {
      setErrorMessage("");
      hasScannedRef.current = false;

      const scanner = new Html5Qrcode(
        "qr-reader"
      );

      scannerRef.current = scanner;

      await scanner.start(
        {
          facingMode: "environment",
        },
        {
          fps: 10,
          qrbox: {
            width: 220,
            height: 220,
          },
        },
        (decodedText) => {
          if (hasScannedRef.current) {
            return;
          }

          const quest = quests.find(
            (item) =>
              item.qrCode === decodedText
          );

          if (quest) {
            hasScannedRef.current = true;
            setIsScanning(false);

            // カメラの停止完了を待つと、端末によっては
            // 映像だけが黒いまま遷移しないことがある。
            navigate(`/quest-loading/${quest.id}`);
            void stopScanner();
          } else {
            setErrorMessage(
              "このQRコードはクエスト用ではありません"
            );
          }
        },
        () => {
          // QRコードをまだ認識していない場合
        }
      );

      setIsScanning(true);
    } catch (error) {
      console.error(
        "Camera error:",
        error
      );

      setErrorMessage(
        "カメラを起動できませんでした。カメラの使用を許可してください。"
      );
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

          {!isScanning && (
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
                onClick={() => {
                  if (hasScannedRef.current) return;
                  hasScannedRef.current = true;
                  advance("qr-scanned");
                  navigate(`/quest-loading/${practiceQuestId}`, { replace: true });
                }}>
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

      <p className="qr-guide">
        {isScanning
          ? "QRコードを枠の中に合わせてください"
          : "カメラを起動してQRコードを読み取ります"}
      </p>

      {errorMessage && (
        <p className="qr-error">
          {errorMessage}
        </p>
      )}

    </main>
  );
}

export default QRScanner;

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from "react-router-dom";

import { quests } from "../../data/quests";

import "./QRScanner.css";

function QRScanner() {
  const navigate = useNavigate();

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);
  const isStartingRef = useRef(false);

  const [isScanning, setIsScanning] =
    useState(false);

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
            navigate(`/battle/${quest.id}`);
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

        <div className="qr-camera-frame">

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
                onClick={startCamera}
              >
                カメラを起動
              </button>
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

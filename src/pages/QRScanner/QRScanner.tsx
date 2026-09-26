import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from "react-router-dom";

import { quests } from "../../data/quests";

import "./QRScanner.css";

function QRScanner() {
  const navigate = useNavigate();

  const scannerRef = useRef<Html5Qrcode | null>(null);

  const [isScanning, setIsScanning] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const startCamera = async () => {
    try {
      setErrorMessage("");

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
          const quest = quests.find(
            (item) =>
              item.qrCode === decodedText
          );

          if (quest) {
            scanner
              .stop()
              .then(() => {
                navigate(
                  `/battle/${quest.id}`
                );
              });
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
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {});
      }
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
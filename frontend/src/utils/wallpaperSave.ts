// スマホ壁紙の保存。端末ごとに、写真アプリへ入れやすい方法を選ぶ

export type DevicePlatform = "ios" | "android" | "other";

// iPhone・iPad・Android を見分ける（iPad は PC 版の表示で Mac と名乗るため、タッチできるかでも見る）
export function detectPlatform(userAgent: string, maxTouchPoints = 0): DevicePlatform {
  if (/iPhone|iPad|iPod/.test(userAgent)) return "ios";
  if (/Macintosh/.test(userAgent) && maxTouchPoints > 1) return "ios";
  if (/Android/.test(userAgent)) return "android";
  return "other";
}

// LINE・Instagram・Facebook・X・TikTok などのアプリの中のブラウザ（保存がうまくいかないことがある）
export function isInAppBrowser(userAgent: string): boolean {
  return /\bLine\/|FBAN|FBAV|Instagram|MicroMessenger|Twitter|BytedanceWebview|musical_ly/.test(userAgent);
}

export type SaveResult = "shared" | "downloaded" | "cancelled" | "failed";

type ShareNavigator = Pick<Navigator, "share" | "canShare">;

// iPhone では共有シートを開き、「画像を保存」で写真アプリに入れてもらう
// （iPhone のふつうのダウンロードは「ファイル」アプリに入り、壁紙に設定しにくいため）
// Android・PC は1枚ずつダウンロードする（Android の共有シートには「画像を保存」がなく、
// ダウンロードした画像はフォト・ギャラリーアプリの「ダウンロード」から開けるため）
// ※ 共有シートは、押した操作の直後でないと開けない。画像は押す前に読み込んでおき、ここでは待たない
export function saveWallpaperFiles(files: File[], platform: DevicePlatform, nav: ShareNavigator = navigator): Promise<SaveResult> {
  if (files.length === 0) return Promise.resolve("failed");

  if (platform === "ios" && typeof nav.share === "function" && nav.canShare?.({ files })) {
    return nav.share({ files }).then(
      () => "shared" as const,
      (error: unknown) => {
        // 共有シートを閉じただけ（AbortError）・すでに開いている（InvalidStateError）ときは何もしない
        // （続けて押したときに、写真アプリではなく「ファイル」アプリへ保存されないように）
        if (error instanceof DOMException && (error.name === "AbortError" || error.name === "InvalidStateError")) {
          return "cancelled" as const;
        }
        // 共有シートを開けなかったときは、ダウンロードに切り替える
        files.forEach(downloadFile);
        return "downloaded" as const;
      },
    );
  }

  files.forEach(downloadFile);
  return Promise.resolve("downloaded");
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.append(link);
  link.click();
  link.remove();
  // ダウンロードが始まる前に消さないよう、少し待ってから片付ける
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

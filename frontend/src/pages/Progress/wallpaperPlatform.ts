import { detectPlatform, isInAppBrowser } from "../../utils/wallpaperSave";

// この端末（壁紙の保存のしかた・設定の手順を出し分ける）
export const platform = detectPlatform(navigator.userAgent, navigator.maxTouchPoints);
export const inAppBrowser = isInAppBrowser(navigator.userAgent);

import test from "node:test";
import assert from "node:assert/strict";
import { WALLPAPER_IDS, getWallpaperFileName, getWallpaperPreviewUrl, getWallpaperUrl } from "../src/api/wallpaperApi.ts";
import { detectPlatform, isInAppBrowser, saveWallpaperFiles } from "../src/utils/wallpaperSave.ts";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const IPAD_DESKTOP = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";
const LINE = `${IPHONE} Line/14.18.0`;

test("wallpaper images come from the API, not the public folder", () => {
  assert.deepEqual([...WALLPAPER_IDS], [1, 2, 3, 4, 5]);
  assert.equal(getWallpaperUrl(3), "/api/wallpapers/3");
  assert.equal(getWallpaperPreviewUrl(3), "/api/wallpapers/3/preview");
  assert.equal(getWallpaperFileName(3), "monhan-festival-wallpaper-3.jpg");
});

test("detects iPhone, iPad (desktop mode), Android and PC", () => {
  assert.equal(detectPlatform(IPHONE), "ios");
  assert.equal(detectPlatform(IPAD_DESKTOP, 5), "ios");
  assert.equal(detectPlatform(IPAD_DESKTOP, 0), "other");
  assert.equal(detectPlatform(ANDROID), "android");
});

test("detects in-app browsers such as LINE", () => {
  assert.equal(isInAppBrowser(LINE), true);
  assert.equal(isInAppBrowser(`${IPHONE} Twitter for iPhone/10.0`), true);
  assert.equal(isInAppBrowser(`${ANDROID} musical_ly_2023 BytedanceWebview/d8a21c6`), true);
  assert.equal(isInAppBrowser(IPHONE), false);
  assert.equal(isInAppBrowser(ANDROID), false);
});

test("iPhone saves through the share sheet, and closing it is not an error", async () => {
  const files = [new File(["x"], "a.jpg", { type: "image/jpeg" })];
  const shared = [];
  const nav = { canShare: () => true, share: async (data) => { shared.push(data.files); } };
  assert.equal(await saveWallpaperFiles(files, "ios", nav), "shared");
  assert.deepEqual(shared, [files]);

  const cancelling = { canShare: () => true, share: async () => { throw new DOMException("cancel", "AbortError"); } };
  assert.equal(await saveWallpaperFiles(files, "ios", cancelling), "cancelled");

  // 続けて押して、共有シートがもう開いているとき（ダウンロードに切り替えない）
  const busy = { canShare: () => true, share: async () => { throw new DOMException("busy", "InvalidStateError"); } };
  assert.equal(await saveWallpaperFiles(files, "ios", busy), "cancelled");

  assert.equal(await saveWallpaperFiles([], "ios", nav), "failed");
});

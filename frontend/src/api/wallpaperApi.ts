// ハンターランクの報酬（スマホ壁紙）の画像。公開フォルダには置かず、API から受け取る
// （画像はサーバーの API のフォルダに手で置く。backend/public/index.php の /api/wallpapers）
import { API_BASE_URL } from "./apiBase.ts";

// 壁紙の番号（サーバーの wallpaper-<番号>.jpg と合わせる）
export const WALLPAPER_IDS = [1, 2, 3, 4, 5] as const;
export type WallpaperId = (typeof WALLPAPER_IDS)[number];

// 保存用の原寸（JPEG）
export const getWallpaperUrl = (id: WallpaperId) => `${API_BASE_URL}/api/wallpapers/${id}`;

// 一覧のカードに敷く画像
export const getWallpaperPreviewUrl = (id: WallpaperId) => `${API_BASE_URL}/api/wallpapers/${id}/preview`;

// 保存したときのファイル名
export const getWallpaperFileName = (id: WallpaperId) => `monhan-festival-wallpaper-${id}.jpg`;

// 原寸の画像を、共有シート・ダウンロードに渡せるファイルとして受け取る。失敗したら null
export async function fetchWallpaperFile(id: WallpaperId, signal?: AbortSignal): Promise<File | null> {
  try {
    const response = await fetch(getWallpaperUrl(id), { signal });
    if (!response.ok) return null;

    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) return null;

    return new File([blob], getWallpaperFileName(id), { type: blob.type });
  } catch {
    return null;
  }
}

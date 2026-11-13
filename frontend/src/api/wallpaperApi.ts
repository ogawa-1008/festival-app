// ハンターランクの報酬（スマホ壁紙）。API は廃止して、静的ファイルとして配信する。
// 保存用の原寸は JPEG、一覧のカードに敷く画像は軽い WebP を使う。
// 画像は public/wallpapers/ に置く（ビルドで dist/wallpapers/ にコピーされる）

// 壁紙の番号（public/wallpapers/wallpaper-<番号>.jpg と合わせる）
export const WALLPAPER_IDS = [1, 2, 3, 4, 5] as const;
export type WallpaperId = (typeof WALLPAPER_IDS)[number];

// 保存用の原寸（JPEG）
export const getWallpaperUrl = (id: WallpaperId) => `/wallpapers/wallpaper-${id}.jpg`;

// 一覧のカードに敷く画像（WebP）
export const getWallpaperPreviewUrl = (id: WallpaperId) => `/wallpapers/wallpaper-${id}-preview.webp`;

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

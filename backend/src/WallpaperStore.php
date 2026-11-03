<?php

declare(strict_types=1);

namespace App;

/**
 * ハンターランクの報酬（スマホ壁紙）の画像ファイル。
 * 画像は公開フォルダ（public_html）にも GitHub にも置かず、API のフォルダの storage/wallpapers/ にサーバーへ手で置く。
 *   wallpaper-<番号>.jpg          … 保存用の原寸
 *   wallpaper-<番号>-preview.webp … 一覧のカードに敷く画像（幅 720）
 */
final class WallpaperStore
{
    public function __construct(private string $directory)
    {
    }

    /**
     * 画像ファイルの場所と種類を返す。番号が範囲外・ファイルがないなら null。
     *
     * @return array{path: string, contentType: string, filename: string}|null
     */
    public function find(int $id, bool $preview): ?array
    {
        if ($id < 1 || $id > 99) {
            return null;
        }

        $name = $preview ? "wallpaper-{$id}-preview.webp" : "wallpaper-{$id}.jpg";
        $path = $this->directory . '/' . $name;

        // 置いた画像が読めない（権限が違うなど）ときも、ないものとして扱う
        if (!is_file($path) || !is_readable($path)) {
            return null;
        }

        return [
            'path' => $path,
            'contentType' => $preview ? 'image/webp' : 'image/jpeg',
            'filename' => $preview ? $name : "monhan-festival-wallpaper-{$id}.jpg",
        ];
    }
}

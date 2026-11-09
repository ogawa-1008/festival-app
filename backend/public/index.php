<?php

declare(strict_types=1);

use App\WallpaperStore;
use Dotenv\Dotenv;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use Slim\Psr7\Stream;

require __DIR__ . '/../vendor/autoload.php';

// .env（あれば）を読み込む。ローカル開発・本番（Xserver）ともここに DB 接続情報を置ける
// （今の API は DB を使わない。アクセスの集計などで DB を使うときのために残している）。
Dotenv::createImmutable(__DIR__ . '/..')->safeLoad();

// エラーの詳しい内容（SQL・ファイルの場所など）は開発用サーバー（composer start）でだけ見せる。
// 本番（Xserver）では詳細を返さず、PHP のエラーログにだけ残す
$isDevServer = PHP_SAPI === 'cli-server';

$app = AppFactory::create();
$app->addRoutingMiddleware();
$app->addErrorMiddleware($isDevServer, true, true);

$wallpapers = new WallpaperStore(__DIR__ . '/../storage/wallpapers');

// レスポンスを JSON で返すための小道具
$json = static function (Response $response, array $payload, int $status = 200): Response {
    $response->getBody()->write(json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));

    return $response->withStatus($status)->withHeader('Content-Type', 'application/json');
};

$app->get('/health', static function (Request $request, Response $response) use ($json): Response {
    return $json($response, ['status' => 'ok']);
});

// スマホ壁紙の画像（原寸・一覧のカードに敷く画像）。画像は公開フォルダに置かず、ここから返す
// ログインがないので、受け取れるランクかどうかは画面の側で確かめる
$sendWallpaper = static function (Response $response, int $id, bool $preview) use ($json, $wallpapers): Response {
    $file = $wallpapers->find($id, $preview);

    $handle = $file === null ? false : fopen($file['path'], 'rb');
    if ($file === null || $handle === false) {
        return $json($response, ['error' => 'unknown wallpaper'], 404);
    }

    return $response
        ->withBody(new Stream($handle))
        ->withHeader('Content-Type', $file['contentType'])
        ->withHeader('Content-Length', (string) filesize($file['path']))
        ->withHeader('Content-Disposition', 'inline; filename="' . $file['filename'] . '"')
        ->withHeader('Cache-Control', 'private, max-age=86400')
        ->withHeader('X-Content-Type-Options', 'nosniff');
};

$app->map(['GET', 'HEAD'], '/api/wallpapers/{id:[0-9]+}', static function (Request $request, Response $response, array $args) use ($sendWallpaper): Response {
    return $sendWallpaper($response, (int) $args['id'], false);
});

$app->map(['GET', 'HEAD'], '/api/wallpapers/{id:[0-9]+}/preview', static function (Request $request, Response $response, array $args) use ($sendWallpaper): Response {
    return $sendWallpaper($response, (int) $args['id'], true);
});

$app->run();

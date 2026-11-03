<?php

declare(strict_types=1);

use App\NoveltyStockRepository;
use App\WallpaperStore;
use Dotenv\Dotenv;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use Slim\Psr7\Stream;

require __DIR__ . '/../vendor/autoload.php';

// .env（あれば）を読み込む。ローカル開発・本番（Xserver）ともここに DB 接続情報を置ける。
Dotenv::createImmutable(__DIR__ . '/..')->safeLoad();

// エラーの詳しい内容（SQL・ファイルの場所など）は開発用サーバー（composer start）でだけ見せる。
// 本番（Xserver）では詳細を返さず、PHP のエラーログにだけ残す
$isDevServer = PHP_SAPI === 'cli-server';

$app = AppFactory::create();
$app->addRoutingMiddleware();
$app->addErrorMiddleware($isDevServer, true, true);

$dbConfig = require __DIR__ . '/../config/database.php';
try {
    $pdo = new PDO($dbConfig['dsn'], $dbConfig['user'], $dbConfig['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $exception) {
    // DB につながらない（.env がない・パスワード違いなど）。接続情報を画面に出さないよう、ここで止める
    error_log('festival-api: DB connection failed: ' . $exception->getMessage());
    http_response_code(503);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'database unavailable']);
    exit;
}

$noveltyStock = new NoveltyStockRepository($pdo);
$wallpapers = new WallpaperStore(__DIR__ . '/../storage/wallpapers');

// レスポンスを JSON で返すための小道具
$json = static function (Response $response, array $payload, int $status = 200): Response {
    $response->getBody()->write(json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));

    return $response->withStatus($status)->withHeader('Content-Type', 'application/json');
};

$app->get('/health', static function (Request $request, Response $response) use ($json): Response {
    return $json($response, ['status' => 'ok']);
});

// ノベルティ（ステッカー）の在庫: エリア（大阪・東京・名古屋）ごとの残数
$app->get('/api/campuses/{campusId}/novelty', static function (Request $request, Response $response, array $args) use ($json, $noveltyStock): Response {
    $campusId = $args['campusId'];
    $remaining = $noveltyStock->remaining($campusId);

    if ($remaining === null) {
        return $json($response, ['error' => 'unknown campus', 'campus' => $campusId], 404);
    }

    return $json($response, ['campus' => $campusId, 'remaining' => $remaining]);
});

// 交換: エリアの残数を1減らす。どの号館で交換しても同じ在庫から減らす
// 呼ばれた分だけ減算する（二重防止・交換条件チェックは呼び出し側の責務）
$app->post('/api/campuses/{campusId}/novelty/redeem', static function (Request $request, Response $response, array $args) use ($json, $noveltyStock): Response {
    $campusId = $args['campusId'];
    $result = $noveltyStock->redeem($campusId);

    if ($result['ok'] === false) {
        if ($result['reason'] === 'not_found') {
            return $json($response, ['error' => 'unknown campus', 'campus' => $campusId], 404);
        }

        return $json($response, ['error' => 'out of stock', 'campus' => $campusId], 409);
    }

    return $json($response, ['campus' => $campusId, 'remaining' => $result['remaining']]);
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

$app->get('/api/wallpapers/{id:[0-9]+}', static function (Request $request, Response $response, array $args) use ($sendWallpaper): Response {
    return $sendWallpaper($response, (int) $args['id'], false);
});

$app->get('/api/wallpapers/{id:[0-9]+}/preview', static function (Request $request, Response $response, array $args) use ($sendWallpaper): Response {
    return $sendWallpaper($response, (int) $args['id'], true);
});

$app->run();

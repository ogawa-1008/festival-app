<?php

declare(strict_types=1);

use App\VisitRepository;
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

// DB には、来場者数の API が呼ばれたときだけつなぐ。
// （壁紙の画像は DB を使わない。DB が止まっても壁紙は返せるように）
// つながらない（.env がない・パスワード違いなど）ときは null。接続情報は画面に出さず、エラーログにだけ残す
$connectDb = static function () use ($dbConfig): ?PDO {
    try {
        return new PDO($dbConfig['dsn'], $dbConfig['user'], $dbConfig['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_EMULATE_PREPARES => false,
            // DB が応答しないときに長く待たない（待っている間、壁紙の API まで遅くならないように）
            PDO::ATTR_TIMEOUT => 3,
        ]);
    } catch (PDOException $exception) {
        error_log('festival-api: DB connection failed: ' . $exception->getMessage());

        return null;
    }
};
$wallpapers = new WallpaperStore(__DIR__ . '/../storage/wallpapers');

// レスポンスを JSON で返すための小道具
$json = static function (Response $response, array $payload, int $status = 200): Response {
    $response->getBody()->write(json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));

    return $response->withStatus($status)->withHeader('Content-Type', 'application/json');
};

$app->get('/health', static function (Request $request, Response $response) use ($json): Response {
    return $json($response, ['status' => 'ok']);
});

// 来場者数（UU）: アプリを開いた端末のランダムな ID を、日本時間の日付ごとに1回だけ記録する
// ログインがないので、ID は画面の側で作る（名前・IP などは受け取らない・残さない）
$app->post('/api/visits', static function (Request $request, Response $response) use ($json, $connectDb): Response {
    $body = json_decode((string) $request->getBody(), true);
    $visitorId = is_array($body) ? ($body['visitorId'] ?? null) : null;

    if (!VisitRepository::isValidVisitorId($visitorId)) {
        return $json($response, ['error' => 'invalid visitorId'], 400);
    }

    $pdo = $connectDb();
    if ($pdo === null) {
        return $json($response, ['error' => 'database unavailable'], 503);
    }

    try {
        (new VisitRepository($pdo))->record($visitorId);
    } catch (PDOException $exception) {
        // テーブルがない（schema.sql をまだ流していない）ときなど。画面の側は、次に開いたときに送り直す
        error_log('festival-api: recording a visit failed: ' . $exception->getMessage());

        return $json($response, ['error' => 'database unavailable'], 503);
    }

    return $response->withStatus(204);
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

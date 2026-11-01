<?php

declare(strict_types=1);

use App\NoveltyStockRepository;
use Dotenv\Dotenv;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

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

// レスポンスを JSON で返すための小道具
$json = static function (Response $response, array $payload, int $status = 200): Response {
    $response->getBody()->write(json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));

    return $response->withStatus($status)->withHeader('Content-Type', 'application/json');
};

$app->get('/health', static function (Request $request, Response $response) use ($json): Response {
    return $json($response, ['status' => 'ok']);
});

// ノベルティ（フィールド配布ステッカー）の在庫: 校舎ごとのフィールド別残数
$app->get('/api/campuses/{campusId}/novelties', static function (Request $request, Response $response, array $args) use ($json, $noveltyStock): Response {
    $campusStock = $noveltyStock->forCampus($args['campusId']);

    if ($campusStock === null) {
        return $json($response, ['error' => 'unknown campus', 'campus' => $args['campusId']], 404);
    }

    return $json($response, $campusStock);
});

// 交換: 残数を1減らす。呼ばれた分だけ減算する（二重防止・交換条件チェックは呼び出し側の責務）
$app->post('/api/campuses/{campusId}/novelties/{fieldId:[0-9]+}/redeem', static function (Request $request, Response $response, array $args) use ($json, $noveltyStock): Response {
    $campusId = $args['campusId'];
    $fieldId = (int) $args['fieldId'];
    $result = $noveltyStock->redeem($campusId, $fieldId);

    if ($result['ok'] === false) {
        if ($result['reason'] === 'not_found') {
            return $json($response, ['error' => 'unknown campus or field', 'campus' => $campusId, 'fieldId' => $fieldId], 404);
        }

        return $json($response, ['error' => 'out of stock', 'campus' => $campusId, 'fieldId' => $fieldId], 409);
    }

    return $json($response, ['campus' => $campusId, 'fieldId' => $fieldId, 'remaining' => $result['remaining']]);
});

$app->run();

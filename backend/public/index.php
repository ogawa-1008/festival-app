<?php

declare(strict_types=1);

use App\NoveltyStock;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';

$app = AppFactory::create();
$app->addRoutingMiddleware();
$app->addErrorMiddleware(true, true, true);

$noveltyStock = new NoveltyStock(require __DIR__ . '/../config/novelties.php');

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

$app->run();

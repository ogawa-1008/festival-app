# backend

モンスターハンターフェスティバル用の API です。Slim Framework（PHP）+ MariaDB で実装します。

## 構成

- `public/index.php` … エントリポイント（Web サーバーのドキュメントルートには `public/` を指定してください）
- `src/` … アプリケーションコード（名前空間 `App\`）
- `config/` … 設定（`database.php` は DB 接続設定）
- `database/schema.sql` … テーブル定義と初期データ（在庫 500）
- `.env.example` … DB 接続情報のテンプレート（コピーして `.env` を作る。`.env` は git 管理外）
- `composer.json` … PHP の依存定義（Slim Framework 4 + PSR-7 実装 + phpdotenv）
- `vendor/` … Composer が生成（git 管理外）

## セットアップ

PHP 8.3 以上と Composer が必要です（本番の Xserver は 8.3）。本番へのデプロイは `docs/deploy.md` を見てください。

```bash
cd backend
composer install
```

### DB（MariaDB）

開発用の MariaDB は Docker で立てるのが手軽です:

```bash
docker run -d --name festival-mariadb --restart unless-stopped \
  -e MARIADB_ROOT_PASSWORD=festival-root \
  -e MARIADB_DATABASE=festival \
  -e MARIADB_USER=festival \
  -e MARIADB_PASSWORD=festival \
  -p 3307:3306 \
  -v festival-mariadb-data:/var/lib/mysql \
  mariadb:10.11
```

テーブル作成と初期データ投入:

```bash
docker exec -i festival-mariadb mariadb -ufestival -pfestival festival < database/schema.sql
```

残数をリセットしたいとき（開発用）:

```bash
docker exec festival-mariadb mariadb -ufestival -pfestival festival -e "UPDATE novelty_stock SET remaining = 500;"
```

接続情報は `config/database.php` の既定値（上記 Docker 用）を使うか、`backend/.env` に書けば上書きできます。本番（Xserver）では `.env` に本番 DB の情報を入れます。

## 起動（開発用）

```bash
cd backend
composer start
```

`composer start` は `php -S 0.0.0.0:8095 -t public` を実行します（0.0.0.0 にしているのは、同じネットワークのスマホ実機から動作確認するためです）。動作確認:

```bash
curl http://localhost:8095/health
# {"status":"ok"}
```

## API

- `GET /health` … 死活確認
- `GET /api/campuses/{campusId}/novelties` … 校舎ごとのステッカー別残数
- `POST /api/campuses/{campusId}/novelties/{fieldId}/redeem` … 交換（残数を1減らす）

`campusId` は `osaka` / `tokyo` / `nagoya`。

```json
{ "campus": "osaka", "novelties": [ { "fieldId": 1, "remaining": 500 }, ... ] }
```

交換が成功すると 200 で新しい残数を返します:

```json
{ "campus": "osaka", "fieldId": 1, "remaining": 499 }
```

- 未知の校舎・フィールド … 404
- 在庫 0 のとき … 409（在庫はマイナスになりません）

※ 交換の二重防止や交換条件（コンプリート判定）はまだ API 側では見ていません（呼ばれた分だけ減ります）。専用 UI の実装時に合わせて設計します。

在庫の保存先は MariaDB の `novelty_stock` テーブル（校舎 × フィールドごとに 1 行）。ステッカーの名前・画像はフロント側（`frontend/src/data/maps.ts`）のデータを使う前提で、API は残数だけを返します。

## 今後の予定

- 専用 UI（フィールドコンプリート → 交換画面）との連携
- 交換の二重防止（端末ごとに一度きりなど）
- Xserver へのデプロイは `docs/deploy.md` にまとめた（GitHub Actions で `festival-api/` に置く）

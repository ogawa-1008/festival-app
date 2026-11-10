# backend

モンスターハンターフェスティバル用の API です。Slim Framework（PHP）で実装しています。スマホ壁紙の画像を返すのと、来場者数（UU）を MariaDB に記録します。

## 構成

- `public/index.php` … エントリポイント（Web サーバーのドキュメントルートには `public/` を指定してください）
- `src/` … アプリケーションコード（名前空間 `App\`）
- `config/` … 設定（`database.php` は DB 接続設定）
- `database/schema.sql` … テーブル定義（来場者数の `site_visits`）
- `.env.example` … DB 接続情報のテンプレート（コピーして `.env` を作る。`.env` は git 管理外）
- `composer.json` … PHP の依存定義（Slim Framework 4 + PSR-7 実装 + phpdotenv）
- `vendor/` … Composer が生成（git 管理外）
- `storage/wallpapers/` … スマホ壁紙の画像（git 管理外。サーバーへ手で置く）

## セットアップ

PHP 8.3 以上と Composer が必要です（本番の Xserver は 8.3）。本番へのデプロイは `docs/deploy.md` を見てください。

```bash
cd backend
composer install
```

### DB（MariaDB）

来場者数の記録に使います（壁紙は DB がなくても返せます）。開発用の MariaDB は Docker で立てるのが手軽です:

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

テーブル作成:

```bash
docker exec -i festival-mariadb mariadb -ufestival -pfestival festival < database/schema.sql
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
- `GET /api/wallpapers/{番号}` … スマホ壁紙の原寸（JPEG）。番号は 1〜5、画像がなければ 404
- `GET /api/wallpapers/{番号}/preview` … スマホ壁紙の一覧のカードに敷く画像（webp、幅 720）
- `POST /api/visits` … 来場者数（UU）の記録。本文は `{"visitorId": "<UUID v4>"}`。日本時間の日付ごとに1回だけ記録し、何度送っても 204。ID の形が違えば 400、DB につながらない・テーブルがないときは 503。集計は `docs/deploy.md` の「来場者数（UU）の集計」

壁紙の画像は git に入れず、`storage/wallpapers/` に手で置きます（`docs/deploy.md` の「スマホ壁紙の画像」）。

ステッカーの在庫の API（`/api/campuses/{campusId}/novelty`）はなくしました。アナログのスタンプラリーでも同じステッカーを配るため、アプリでは在庫を数えません。交換したかどうかは、これまでどおり端末の保存データに記録します。

## 今後の予定

- Xserver へのデプロイは `docs/deploy.md` にまとめた（GitHub Actions で `festival-api/` に置く）

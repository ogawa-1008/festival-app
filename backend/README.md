# backend

モンスターハンターフェスティバル用の API です。Slim Framework（PHP）で実装します。

## 構成

- `public/index.php` … エントリポイント（Web サーバーのドキュメントルートには `public/` を指定してください）
- `src/` … アプリケーションコード（名前空間 `App\`）
- `config/` … 設定・固定データ
- `composer.json` … PHP の依存定義（Slim Framework 4 + PSR-7 実装）
- `vendor/` … Composer が生成（git 管理外）

## セットアップ

PHP 8.1 以上と Composer が必要です。

```bash
cd backend
composer install
```

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

`campusId` は `osaka` / `tokyo` / `nagoya`。未知の校舎は 404 を返します。

```json
{
  "campus": "osaka",
  "novelties": [
    { "fieldId": 1, "remaining": 500 },
    { "fieldId": 2, "remaining": 500 },
    { "fieldId": 3, "remaining": 500 },
    { "fieldId": 4, "remaining": 500 }
  ]
}
```

在庫は `config/novelties.php` の固定値です（校舎 × フィールドごとに 500）。ステッカーの名前・画像はフロント側（`frontend/src/data/maps.ts`）のデータを使う前提で、API は残数だけを返します。

## 今後の予定

- 交換時の在庫減算と実在庫管理（DB 化）
- 交換フロー（フィールドコンプリート → 専用 UI）との連携

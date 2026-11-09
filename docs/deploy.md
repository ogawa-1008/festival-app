# 本番（Xserver）へのデプロイ

main に push（PR をマージ）すると、GitHub Actions（`.github/workflows/deploy.yml`）が自動でサーバーに置きます。Actions 画面の「Run workflow」で手動でも実行できます。

## サーバーの置き場所

FTP アカウントで見たときのパスです（`/` がサーバーのホーム）。

```
/vantan-monhan-festival.com/
├── public_html/          … アプリ（frontend/dist）。https://vantan-monhan-festival.com/ で見える
│   ├── .htaccess         … 画面の URL は index.html へ、/api/〜 は api/index.php へ渡す
│   └── api/index.php     … API の入り口。下の festival-api を読み込むだけ
└── festival-api/         … API 本体（backend）。ブラウザからは直接見えない
    ├── .env              … DB の接続情報（手で置く。GitHub には載せない。今の API は DB を使わない）
    ├── storage/wallpapers/ … スマホ壁紙の画像（手で置く。GitHub には載せない）
    ├── public/index.php
    └── vendor/ …
```

Actions は API（festival-api）を先に置いてから、アプリ（public_html）を置きます。

## 最初の1回だけ、サーバーで手でやること

1. **PHP のバージョン**：サーバーパネルの「PHP Ver.切替」で、`vantan-monhan-festival.com` が PHP 8.3 以上になっているか確認する（API は 8.3 以上が必要。今は 8.3.36）。
2. **DB**（今の API は DB を使わないので、DB を使う機能を足すときだけ）：サーバーパネルで MySQL（MariaDB）の DB とユーザーを作り、ユーザーに DB へのアクセス権を付ける。テーブルは phpMyAdmin の「SQL」タブで `backend/database/schema.sql` の中身を実行して作る。
3. **.env**（2 と同じく、DB を使うときだけ）：最初のデプロイで `festival-api/` ができたら、WebFTP でその中に `.env` を置く。

   ```
   DB_DSN="mysql:host=localhost;dbname=DB名;charset=utf8mb4"
   DB_USER="MySQLユーザー名"
   DB_PASSWORD="MySQLユーザーのパスワード"
   ```

   Mac では「.」で始まる名前のファイルが見えなくなるので、`env.txt` で作ってアップロードし、WebFTP で `.env` に名前を変えると楽です。デプロイしても `.env` は消えたり上書きされたりしません。
4. **スマホ壁紙の画像**：`festival-api/` の中に `storage/wallpapers/` を作り、壁紙の画像10枚を置く（下の「スマホ壁紙の画像」）。

## 動いているかの確認

- Xserver の「404 File Not Found」が出るときは、`.htaccess` か `api/index.php` が置かれていない。
- `https://vantan-monhan-festival.com/api/wallpapers/1/preview` を開いて、壁紙の一覧用の画像が出れば OK。`{"error":"unknown wallpaper"}` が出るときは、画像が置かれていない（場所・ファイル名が違う）。

## スマホ壁紙の画像

壁紙は IP の素材で、リポジトリが公開のため GitHub には入れません。公開フォルダ（public_html）にも置かず、API（`GET /api/wallpapers/{番号}`）から返します。

- 置き場所：`/vantan-monhan-festival.com/festival-api/storage/wallpapers/`
- ファイル（番号は 1〜5）
  - `wallpaper-<番号>.jpg` … 保存用の原寸（1402×2917）
  - `wallpaper-<番号>-preview.webp` … 一覧のカードに敷く画像（幅 720。カードの幅いっぱいに出すため）
- 元の画像（`スタンプラリー用/壁紙/作品0<番号>｜両ロゴ版.png`）からの作り方（Mac）：

  ```bash
  sips -s format jpeg -s formatOptions 88 "作品01｜両ロゴ版.png" --out wallpaper-1.jpg
  cwebp -q 80 -resize 720 0 "作品01｜両ロゴ版.png" -o wallpaper-1-preview.webp
  ```

- ローカルで動かすときも、同じ名前で `backend/storage/wallpapers/` に置く（git には入らない）。
- 権限は、ほかのファイルと同じ既定のままでよい（フォルダ 705・ファイル 604）。
- デプロイしても、この画像は消えたり上書きされたりしません。Actions は `storage/` をフォルダごと対象から外しています（`.github/workflows/deploy.yml` の `exclude`）。この `exclude` を外したり、デプロイの設定で `dangerous-clean-slate`（サーバーのファイルをいったん全部消す）を使ったりしないでください。
- ログインがないため、受け取れるランクかどうかは画面の側でだけ確かめています。API の URL を知っていれば、ランクに関係なく画像を開けます。

## ステッカーの在庫のテーブル（もう使わない）

ステッカーの在庫はアプリで数えるのをやめたので、DB に残っている `campus_novelty_stock`（エリアごとの在庫）と `novelty_stock`（号館ごとの在庫）は使いません。消すときは、phpMyAdmin で DB を選び、「SQL」タブで次を実行します（消すと元に戻せません）。

```sql
DROP TABLE IF EXISTS campus_novelty_stock;
DROP TABLE IF EXISTS novelty_stock;
```

## GitHub の Secrets

| 名前 | 中身 |
|---|---|
| `FTP_HOST` | FTP のホスト名 |
| `FTP_USERNAME` | FTP アカウント |
| `FTP_PASSWORD` | FTP のパスワード |

DB のパスワードは Secrets にも入れず、サーバーの `.env` にだけ置きます（リポジトリは公開のため）。

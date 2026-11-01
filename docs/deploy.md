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
    ├── .env              … DB の接続情報（手で置く。GitHub には載せない）
    ├── public/index.php
    └── vendor/ …
```

Actions は API（festival-api）を先に置いてから、アプリ（public_html）を置きます。

## 最初の1回だけ、サーバーで手でやること

1. **PHP のバージョン**：サーバーパネルの「PHP Ver.切替」で、`vantan-monhan-festival.com` が PHP 8.3 以上になっているか確認する（API は 8.3 以上が必要。今は 8.3.36）。
2. **DB**：サーバーパネルで MySQL（MariaDB）の DB とユーザーを作り、ユーザーに DB へのアクセス権を付ける。
3. **テーブルと初期在庫**：phpMyAdmin で DB を選び、「SQL」タブで `backend/database/schema.sql` の中身を実行する（号館ごとに在庫 500。何度実行しても今の残数は変わらない）。
4. **.env**：最初のデプロイで `festival-api/` ができたら、WebFTP でその中に `.env` を置く。

   ```
   DB_DSN="mysql:host=localhost;dbname=DB名;charset=utf8mb4"
   DB_USER="MySQLユーザー名"
   DB_PASSWORD="MySQLユーザーのパスワード"
   ```

   Mac では「.」で始まる名前のファイルが見えなくなるので、`env.txt` で作ってアップロードし、WebFTP で `.env` に名前を変えると楽です。デプロイしても `.env` は消えたり上書きされたりしません。

## 動いているかの確認

- `https://vantan-monhan-festival.com/api/campuses/tokyo/novelties` を開いて、号館ごとの在庫（`remaining`）が JSON で出れば OK。
- `{"error":"database unavailable"}` が出るときは、DB につながっていない（`.env` がない・場所が違う・DB 名やパスワードが違う）。詳しい原因はサーバーパネルの PHP のエラーログに出る。
- Xserver の「404 File Not Found」が出るときは、`.htaccess` か `api/index.php` が置かれていない。

## GitHub の Secrets

| 名前 | 中身 |
|---|---|
| `FTP_HOST` | FTP のホスト名 |
| `FTP_USERNAME` | FTP アカウント |
| `FTP_PASSWORD` | FTP のパスワード |

DB のパスワードは Secrets にも入れず、サーバーの `.env` にだけ置きます（リポジトリは公開のため）。

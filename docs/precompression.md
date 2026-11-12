# 静的ファイルの事前圧縮（gzip）

## なぜやるか

負荷テスト（`~/festival-loadtest`）の実測で、配信方式だけで静的ファイルの処理能力が約 40 倍変わった。

| 配信方式 | スループット | p95 |
| --- | ---: | ---: |
| リクエストのたびに gzip（動的圧縮） | 76 rps | 1,395 ms |
| 事前に作った `.gz` を返す（事前圧縮） | 3,087 rps | 45 ms |

開場直後に 1,000 人が一斉に開くと約 150 rps が必要になるため、動的圧縮のままだと最初の数十秒で詰まる。
JS が 746 KB あるので、圧縮の CPU を使うか使わないかの差がそのまま待ち時間になる。

## 仕組み

1. `npm run build` の最後で `frontend/scripts/precompress.mjs` が走り、`dist/` のテキストファイル（js / css / html / svg / json など）の隣に `.gz` を作る。
2. サーバーは `.gz` があればそれを返す。無ければ黙って毎回圧縮に落ちる（エラーにはならない）。
3. そのため「`.gz` を上げ忘れていないか」を機械的に確認する必要がある。

`.gz` は 1 KB 未満のファイルと、圧縮すると元より大きくなるファイルには作らない。

## 確認方法

### ビルド直後（CI でも実行）

```bash
npm run build
npm run verify:gzip --workspace frontend
```

`dist/` の対象ファイルすべてに有効な `.gz` があるかを確認する。1 つでも欠けたら失敗する。

### デプロイ後（本番）

```bash
npm run check:prod --workspace frontend
# URL を変える場合: node frontend/scripts/check-prod-compression.mjs https://example.com/
```

見分け方はレスポンスヘッダ。

- 事前圧縮: `content-length` あり・`etag` が `"..."`（強い ETag）
- 動的圧縮: `content-length` なし（chunked）・`etag` が `W/"..."`（弱い ETag）

## サーバー側の設定について

`.gz` を置くだけでは効かない場合、サーバーが `.gz` を選ぶ設定になっている必要がある。

- nginx: `gzip_static on;`
- Apache: `.htaccess` で `mod_rewrite` + `mod_headers` を使い、`Accept-Encoding: gzip` のときに `.gz` を `Content-Encoding: gzip` で返す

本番は Xserver の共用サーバーで nginx の設定は変更できないため、実際にどちらの経路で効くかは
`.gz` をデプロイしたうえで `check:prod` で確認する。**設定を入れる前に必ず確認すること。**

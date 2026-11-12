#!/usr/bin/env node
// 本番が「事前圧縮されたファイル」を返しているかを確認する（デプロイ後のスモーク用）。
//
// 見分け方:
//   事前圧縮（.gz を配信）  … content-length あり・etag が強い（W/ が付かない）
//   毎回圧縮（動的 gzip）   … content-length なし（chunked）・etag が W/"..." になる
//
// 使い方: node scripts/check-prod-compression.mjs [URL]
//   既定の URL は https://vantan-monhan-festival.com/
//   .gz を上げ忘れていても .htaccess が効いていなくても、サイトは普通に動く。
//   だからこの確認は「動くかどうか」ではなく「速いかどうか」を見るためにある。

const BASE = process.argv[2] ?? 'https://vantan-monhan-festival.com/'
const TIMEOUT_MS = 15000

/** index.html から、初回表示で読まれる JS / CSS の URL を拾う。 */
function extractAssets(html) {
  const assets = new Set()
  const patterns = [
    /<script[^>]+src="([^"]+)"/g,
    /<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g,
    /<link[^>]+href="([^"]+)"[^>]+rel="stylesheet"/g,
  ]
  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const url = match[1]
      if (/\.(js|mjs|css)(\?|$)/.test(url)) assets.add(url)
    }
  }
  return [...assets]
}

async function head(url) {
  const res = await fetch(url, {
    method: 'HEAD',
    headers: { 'Accept-Encoding': 'gzip' },
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  return res
}

const baseUrl = new URL(BASE)
const indexRes = await fetch(baseUrl, {
  headers: { 'Accept-Encoding': 'gzip' },
  signal: AbortSignal.timeout(TIMEOUT_MS),
})
if (!indexRes.ok) {
  console.error(`index.html を取得できませんでした: HTTP ${indexRes.status}`)
  process.exit(1)
}

const assets = extractAssets(await indexRes.text())
if (assets.length === 0) {
  console.error('index.html から JS / CSS の参照が見つかりませんでした')
  process.exit(1)
}

console.log(`対象: ${baseUrl.href}`)
const failures = []

for (const asset of assets) {
  const url = new URL(asset, baseUrl)
  const res = await head(url)
  const encoding = res.headers.get('content-encoding') ?? '-'
  const length = res.headers.get('content-length')
  const etag = res.headers.get('etag') ?? '-'

  const precompressed = encoding === 'gzip' && length !== null && !etag.startsWith('W/')
  const state = precompressed ? 'OK  ' : 'NG  '
  console.log(
    `${state} ${url.pathname}  encoding=${encoding}  length=${length ?? 'なし(chunked)'}  etag=${etag}`,
  )
  if (!precompressed) failures.push(url.pathname)
}

if (failures.length > 0) {
  console.error(
    `\n${failures.length}/${assets.length} 件が毎回圧縮（動的 gzip）のままです。\n` +
      '  .gz がサーバーに上がっていないか、.htaccess の設定が効いていません。\n' +
      '  この状態だと静的配信の上限が約 76rps まで落ちます（事前圧縮なら約 3,000rps）。',
  )
  process.exit(1)
}

console.log(`\n事前圧縮で配信されています（${assets.length} 件すべて OK）`)

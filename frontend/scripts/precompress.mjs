#!/usr/bin/env node
// ビルド後の dist/ に gzip 済みの .gz を置く。
//
// なぜ必要か: 742KB の JS をリクエストのたびに圧縮すると 76rps しか出ないが、
// 事前に作った .gz を返すだけなら約 3,000rps 出る（負荷テスト実測で約 40 倍差）。
// サーバーは .gz があればそれを返し、無ければ黙って「毎回圧縮」に落ちるので、
// .gz を作り忘れないこと自体がそのまま性能になる。
//
// 使い方: node scripts/precompress.mjs（npm run build の最後で自動実行される）
import { gzipSync } from 'node:zlib'
import { copyFile, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isTarget } from './gzip-targets.mjs'

const DIST = fileURLToPath(new URL('../dist/', import.meta.url))
const PUBLIC_DIR = fileURLToPath(new URL('../public/', import.meta.url))

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walk(path)))
    } else if (entry.isFile()) {
      files.push(path)
    }
  }
  return files
}

let files
try {
  files = await walk(DIST)
} catch {
  console.error(`dist/ が見つかりません: ${DIST}\n先に vite build を実行してください。`)
  process.exit(1)
}

let rawTotal = 0
let gzTotal = 0
let made = 0
let skipped = 0

for (const file of files) {
  const { size } = await stat(file)
  if (!isTarget(file, size)) continue

  const raw = await readFile(file)
  const gz = gzipSync(raw, { level: 9 })

  // 元より大きくなるなら置かない（サーバーは .gz を優先してしまうため）。
  if (gz.length >= raw.length) {
    skipped += 1
    continue
  }

  await writeFile(`${file}.gz`, gz)
  made += 1
  rawTotal += raw.length
  gzTotal += gz.length

  const name = relative(DIST, file)
  const ratio = ((gz.length / raw.length) * 100).toFixed(0)
  console.log(`  ${name}  ${raw.length} → ${gz.length} B (${ratio}%)`)
}

if (made === 0) {
  console.log('事前圧縮: 対象ファイルなし')
} else {
  const saved = (100 - (gzTotal / rawTotal) * 100).toFixed(0)
  console.log(
    `事前圧縮: ${made} ファイル ${rawTotal.toLocaleString()} → ${gzTotal.toLocaleString()} B（${saved}% 削減）`,
  )
}
if (skipped > 0) {
  console.log(`  ${skipped} ファイルは元より大きくなるためスキップ`)
}

// Vite は public/ のファイルを dist/ にコピーするが、サブディレクトリのドットファイル
// （ディレクトリ単位の .htaccess など）はコピーしない。取りこぼすと設定が効かないので写す。
async function copyDotfiles(dir, base = dir) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      await copyDotfiles(path, base)
    } else if (entry.isFile() && entry.name.startsWith('.')) {
      const rel = relative(base, path)
      await mkdir(dirname(join(DIST, rel)), { recursive: true })
      await copyFile(path, join(DIST, rel))
      console.log(`  ${rel} を dist/ にコピーしました`)
    }
  }
}

await copyDotfiles(PUBLIC_DIR)

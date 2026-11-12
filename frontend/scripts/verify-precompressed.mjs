#!/usr/bin/env node
// dist/ の静的ファイルに .gz が揃っているかを検証する（CI 用）。
//
// .gz が欠けていてもサイトは動く。ただしサーバーは黙って「毎回圧縮」に落ちるので、
// 性能だけが静かに 40 分の 1 になる。それをデプロイ前にここで止める。
//
// 使い方: node scripts/verify-precompressed.mjs
import { gunzipSync } from 'node:zlib'
import { readdir, readFile, stat } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isTarget } from './gzip-targets.mjs'

const DIST = fileURLToPath(new URL('../dist/', import.meta.url))

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
  console.error(`dist/ が見つかりません: ${DIST}\n先に npm run build を実行してください。`)
  process.exit(1)
}

const problems = []
let checked = 0

for (const file of files) {
  const { size } = await stat(file)
  if (!isTarget(file, size)) continue
  checked += 1

  const name = relative(DIST, file)
  let gz
  try {
    gz = await readFile(`${file}.gz`)
  } catch {
    problems.push(`${name}: .gz がありません`)
    continue
  }

  if (gz.length >= size) {
    problems.push(`${name}: .gz が元より大きい（${gz.length} >= ${size}）`)
    continue
  }

  // 壊れた .gz を配るとブラウザ側で表示できなくなるので、中身まで確認する。
  try {
    const restored = gunzipSync(gz)
    if (!restored.equals(await readFile(file))) {
      problems.push(`${name}: .gz を解凍した内容が元ファイルと一致しません`)
    }
  } catch {
    problems.push(`${name}: .gz が壊れています`)
  }
}

if (checked === 0) {
  console.error('検証対象のファイルがありません（ビルド成果物が空の可能性）')
  process.exit(1)
}

if (problems.length > 0) {
  console.error(`事前圧縮の検証に失敗しました（${problems.length} 件 / 対象 ${checked} 件）`)
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exit(1)
}

console.log(`事前圧縮の検証 OK（${checked} ファイルすべてに有効な .gz あり）`)

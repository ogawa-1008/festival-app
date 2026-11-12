// 事前圧縮（gzip）の対象を決める共通の条件。
// 生成側（precompress.mjs）と検証側（verify-precompressed.mjs）で必ず同じ条件を使う。
import { extname } from 'node:path'

/** gzip する価値がある拡張子（テキストで、まだ圧縮されていないもの）。 */
export const TARGET_EXTENSIONS = new Set([
  '.js',
  '.mjs',
  '.css',
  '.html',
  '.svg',
  '.json',
  '.txt',
  '.xml',
  '.webmanifest',
])

/** これ未満のファイルは gzip ヘッダ分で元より大きくなることがあるので対象外。 */
export const MIN_BYTES = 1024

/** 事前圧縮の対象にすべきファイルか。 */
export function isTarget(file, size) {
  return TARGET_EXTENSIONS.has(extname(file).toLowerCase()) && size >= MIN_BYTES
}

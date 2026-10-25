// 会場に貼るクエストのQRコードを作る。
// 使い方（frontend で）：npm run qr -- --base https://本番のドメイン [--out 出力先]
//   QRの中身は「本番のドメイン/q/QUEST_OSAKA_1」の URL。スマホの標準カメラで読むとアプリが開く
//   出力：PNG（1枚ずつ）・SVG（1枚ずつ）・印刷用の HTML（A4 1枚に1つ。ブラウザで開いて PDF に保存・印刷する）
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import QRCode from "qrcode";

import { campuses } from "../src/data/campuses.ts";
import { getCampusQuests, getMapAreas } from "../src/data/maps.ts";
import { buildQuestQrUrl } from "../src/utils/questQr.ts";

const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};

const baseUrl = option("base") ?? process.env.QR_BASE_URL;
if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
  console.error("本番のアプリの URL を --base で指定してください（例：npm run qr -- --base https://festival.example.com）");
  process.exit(1);
}
const outDir = resolve(option("out") ?? "quest-qr");

const escapeHtml = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const rows = campuses.flatMap((campus) =>
  getCampusQuests(campus.id).map((quest) => {
    const area = getMapAreas(campus.id).find((item) => item.questIds.includes(quest.id));
    return {
      campus: campus.name,
      building: area?.buildingName ?? "",
      field: area?.areaName ?? "",
      monster: area?.photoSpotMonster ?? "",
      code: quest.qrCode,
      url: buildQuestQrUrl(baseUrl, quest.qrCode),
    };
  }),
);

await mkdir(join(outDir, "png"), { recursive: true });
await mkdir(join(outDir, "svg"), { recursive: true });

// 少し汚れたり欠けたりしても読めるよう、誤り訂正は一番強い H にする
const qrOptions = { errorCorrectionLevel: "H", margin: 4 };
const pages = [];
for (const row of rows) {
  await QRCode.toFile(join(outDir, "png", `${row.code}.png`), row.url, { ...qrOptions, width: 1000 });
  const svg = await QRCode.toString(row.url, { ...qrOptions, type: "svg" });
  await writeFile(join(outDir, "svg", `${row.code}.svg`), svg);
  pages.push(`<section class="page">
  <p class="campus">${escapeHtml(row.campus)}エリア</p>
  <h1>${escapeHtml(row.building)}</h1>
  <p class="field">${escapeHtml(row.field)}</p>
  <div class="qr">${svg}</div>
  <p class="monster">${escapeHtml(row.monster)}を討伐せよ！</p>
  <p class="hint">スマホのカメラで読み取ってください</p>
  <p class="url">${escapeHtml(row.url)}</p>
</section>`);
}

await writeFile(join(outDir, "quest-qr-print.html"), `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>クエストQRコード</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #ddd; font-family: "Hiragino Mincho ProN", "Yu Mincho", serif; color: #1a1410; }
  .page { width: 210mm; height: 297mm; margin: 10mm auto; padding: 22mm 20mm; background: #fff;
          display: flex; flex-direction: column; align-items: center; text-align: center; break-after: page; }
  .campus { margin: 0; font-size: 16pt; letter-spacing: 0.3em; color: #6b5537; }
  h1 { margin: 4mm 0 0; font-size: 44pt; letter-spacing: 0.1em; }
  .field { margin: 2mm 0 0; font-size: 18pt; color: #6b5537; }
  .qr { width: 150mm; height: 150mm; margin-top: 10mm; }
  .qr svg { width: 100%; height: 100%; display: block; }
  .monster { margin: 10mm 0 0; font-size: 26pt; font-weight: bold; }
  .hint { margin: 4mm 0 0; font-size: 13pt; color: #555; }
  .url { margin-top: auto; font-family: ui-monospace, Menlo, monospace; font-size: 9pt; color: #999; }
  @media print { body { background: #fff; } .page { margin: 0; } }
</style>
</head>
<body>
${pages.join("\n")}
</body>
</html>
`);

console.log(`${rows.length} 件のQRコードを作りました：${outDir}`);
console.log(`例：${rows[0]?.url}`);

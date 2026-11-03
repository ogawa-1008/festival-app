// IP の画像を、ドラッグ＆ドロップと右クリックの「画像を保存」で保存できないようにする
// （ページ全体で受け取るので、あとから足した画像も対象になる。スクリーンショットや開発者ツールは止められない）
// 保存してもらう画像（スマホ壁紙の原寸）だけは、data-allow-save を付けて対象から外す
function blockOnImage(event: Event) {
  if (event.target instanceof HTMLImageElement && !event.target.hasAttribute("data-allow-save")) event.preventDefault();
}

export function installImageProtection() {
  document.addEventListener("dragstart", blockOnImage);
  document.addEventListener("contextmenu", blockOnImage);
}

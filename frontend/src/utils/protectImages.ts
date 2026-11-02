// IP の画像を、ドラッグ＆ドロップと右クリックの「画像を保存」で保存できないようにする
// （ページ全体で受け取るので、あとから足した画像も対象になる。スクリーンショットや開発者ツールは止められない）
function blockOnImage(event: Event) {
  if (event.target instanceof HTMLImageElement) event.preventDefault();
}

export function installImageProtection() {
  document.addEventListener("dragstart", blockOnImage);
  document.addEventListener("contextmenu", blockOnImage);
}

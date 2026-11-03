import { useState } from "react";
import { inAppBrowser, platform } from "./wallpaperPlatform";

// スマホ壁紙の一覧・壁紙ごとの画面で使う部品

// 壁紙の画像。読み込み中は暗い枠、読み込めなかったときは案内を出す（壊れた画像のアイコンを見せない）
// fallbackSrc … src を読み込めなかったときに代わりに出す画像（同じ壁紙を別の方法で読み込んだもの）
// allowSave … 長押し・右クリックで保存できるようにする（壁紙ごとの画面の大きい画像だけ）
export function WallpaperImage({
  src,
  fallbackSrc,
  alt,
  allowSave = false,
}: {
  src: string;
  fallbackSrc?: string;
  alt: string;
  allowSave?: boolean;
}) {
  const [failed, setFailed] = useState<string[]>([]);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const shown = !failed.includes(src)
    ? src
    : fallbackSrc && !failed.includes(fallbackSrc) ? fallbackSrc : null;
  const state = shown === null ? "error" : loadedSrc === shown ? "loaded" : "loading";

  return (
    <span className={`wallpaper-image is-${state}`}>
      {shown !== null && (
        <img
          src={shown}
          alt={alt}
          width={1402}
          height={2917}
          data-allow-save={allowSave ? "" : undefined}
          onLoad={() => setLoadedSrc(shown)}
          onError={() => setFailed((list) => [...list, shown])}
        />
      )}
      {shown === null && <span className="wallpaper-image-error">読み込めませんでした</span>}
    </span>
  );
}

// 左右の矢印。文字（‹ ›）は書体によって下に寄って見えるため、図形で描いて真ん中にそろえる
export function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg className="wallpaper-chevron" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// LINE などのアプリの中のブラウザでは、保存できないことがある
export function WallpaperInAppNotice() {
  if (!inAppBrowser) return null;
  return (
    <p className="wallpaper-notice" role="note">
      LINE などのアプリの中で開いていると、保存できないことがあります。メニューから「ブラウザで開く」を選び、Safari や Chrome で開いてください。
    </p>
  );
}

const IOS_STEPS = (
  <ol className="progress-steps">
    <li>
      壁紙の画面で「壁紙をダウンロード」を押し、出てきたメニューで「画像を保存」を選ぶ
      <small>壁紙の画像を長押しし、「"写真"に保存」を選んでも保存できます</small>
    </li>
    <li>「写真」アプリで保存した壁紙を開き、左下の共有ボタン（四角から矢印が出ているボタン）を押す</li>
    <li>「壁紙に設定」を選び、位置を合わせて「追加」を押す</li>
    <li>
      「壁紙を両方に設定」を選ぶと、ロック画面とホーム画面に設定されます
      <small>ホーム画面だけ別の画像にしたいときは「ホーム画面をカスタマイズ」を選びます。iOS のバージョンによって、ボタンの名前が少し違うことがあります</small>
    </li>
  </ol>
);

const ANDROID_STEPS = (
  <ol className="progress-steps">
    <li>
      壁紙の画面で「壁紙をダウンロード」を押す
      <small>壁紙の画像を長押しし、「画像をダウンロード」を選んでも保存できます</small>
    </li>
    <li>「フォト」や「ギャラリー」アプリで、保存した壁紙を開く（「ダウンロード」のフォルダに入っています）</li>
    <li>右上のメニュー（︙）から「壁紙として設定」を選ぶ（「その他の用途」→「壁紙」の場合もあります）</li>
    <li>
      「ホーム画面」を選んで設定する
      <small>メーカーや機種によって、メニューの名前や場所が違います。「設定」アプリの「壁紙」からも設定できます</small>
    </li>
  </ol>
);

// ホーム画面に設定する方法（折りたたみ）。開いている端末の手順だけを出す（PC では両方）
export function WallpaperHowTo() {
  const sections = platform === "ios"
    ? [{ label: "iPhone", steps: IOS_STEPS }]
    : platform === "android"
      ? [{ label: "Android", steps: ANDROID_STEPS }]
      : [{ label: "iPhone", steps: IOS_STEPS }, { label: "Android", steps: ANDROID_STEPS }];

  return (
    <div className="wallpaper-howto-list">
      {sections.map(({ label, steps }) => (
        <details key={label} className="wallpaper-howto">
          <summary>
            {sections.length > 1 ? `ホーム画面に設定する方法（${label}）` : "ホーム画面に設定する方法"}
          </summary>
          {steps}
        </details>
      ))}
    </div>
  );
}

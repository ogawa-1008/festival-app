import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import BottomNavigation from "../../components/Navigation/BottomNavigation";
import { WALLPAPER_IDS, type WallpaperId, fetchWallpaperFile, getWallpaperUrl } from "../../api/wallpaperApi";
import { useGame } from "../../context/GameContext";
import { getWallpaperProgress } from "../../utils/hunterRankReward";
import { saveWallpaperFiles } from "../../utils/wallpaperSave";
import { Chevron, WallpaperHowTo, WallpaperImage, WallpaperInAppNotice } from "./WallpaperParts";
import { inAppBrowser, platform } from "./wallpaperPlatform";

import "./Progress.css";

// ダウンロードしたあとの案内（端末ごとに、保存された場所が違う）
const DOWNLOADED_MESSAGE = {
  ios: "ダウンロードしました。「ファイル」アプリの「ダウンロード」に入っています。写真アプリに入れたいときは、壁紙の画像を長押ししてください。",
  android: "ダウンロードしました。「フォト」や「ギャラリー」アプリの「ダウンロード」から開けます。",
  other: "ダウンロードしました。スマホで開くと、写真アプリに保存できます。",
} as const;

// 一覧から開いたことを、壁紙の画面に伝える（前・次で切り替えても引き継ぐ）
const WALLPAPER_LINK_STATE = { fromList: true };

// LINE などのアプリの中でダウンロードしたあとの案内
const IN_APP_DOWNLOAD_MESSAGE = "保存できたか、写真アプリやファイルで確かめてください。保存されていないときは、下の案内を見てください。";

// ボタンの下の説明。会場ではスマホで開くので、長押しでの保存を案内する（PC では出さない）
const DOWNLOAD_NOTE = {
  ios: "写真アプリに保存できます。画像の長押しでも保存できます",
  android: "画像の長押しでも保存できます",
  other: null,
} as const;

// 進捗：スマホ壁紙を1枚ずつ見て保存する画面（/progress/wallpaper/1〜5）
// ランクが届いていない・番号が違うときは、一覧へ戻す（画像は読み込まない）
function ProgressWallpaperDetail() {
  const { wallpaperId } = useParams();
  const { rankExp } = useGame();
  const id = WALLPAPER_IDS.find((item) => String(item) === wallpaperId);

  if (!id || !getWallpaperProgress(rankExp).reached) {
    return <Navigate to="/progress/wallpaper" replace />;
  }

  // 壁紙を切り替えたら、読み込み・案内をやり直す
  return <WallpaperDetail key={id} id={id} />;
}

function WallpaperDetail({ id }: { id: WallpaperId }) {
  // 保存用の原寸の画像と、それを表示するための URL。null は読み込み中
  // （読み込んだ画像を表示にも使うので、保存されるものと表示が同じになり、読み込みも1回で済む）
  const [loaded, setLoaded] = useState<{ file: File; url: string } | "error" | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const fromList = (useLocation().state as { fromList?: boolean } | null)?.fromList === true;
  const releaseTimer = useRef<number | undefined>(undefined);

  // 画面を離れたら、保存ボタンを戻すタイマーを止める
  useEffect(() => () => window.clearTimeout(releaseTimer.current), []);

  // 一覧でスクロールした位置のまま開かないよう、上から見せる（このアプリは body がスクロールする）
  useLayoutEffect(() => {
    document.body.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, []);

  // 共有シートは押した直後でないと開けないため、画面を開いたときに読み込んでおく
  useEffect(() => {
    const controller = new AbortController();
    let url: string | null = null;
    void fetchWallpaperFile(id, controller.signal).then((file) => {
      if (controller.signal.aborted) return;
      if (!file) {
        setLoaded("error");
        return;
      }
      url = URL.createObjectURL(file);
      setLoaded({ file, url });
    });
    return () => {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [id, attempt]);

  const handleSave = () => {
    setMessage(null);

    if (loaded === "error") {
      setLoaded(null);
      setAttempt((value) => value + 1);
      return;
    }
    if (!loaded || saving) return;

    // 共有シートを開いている間は押せないようにする（続けて押すと、別の保存先に入ってしまうため）
    // 古い iOS では共有シートの結果が返らないことがあるので、少し待ったら押せる状態に戻す
    // （戻したあとに押しても、共有シートが開いたままならダウンロードにはならない）
    setSaving(true);
    window.clearTimeout(releaseTimer.current);
    releaseTimer.current = window.setTimeout(() => setSaving(false), 4000);
    void saveWallpaperFiles([loaded.file], platform).then((result) => {
      window.clearTimeout(releaseTimer.current);
      setSaving(false);
      // LINE などのアプリの中では、ダウンロードが始まらないことがあるので「しました」とは言わない
      if (result === "downloaded") setMessage(inAppBrowser ? IN_APP_DOWNLOAD_MESSAGE : DOWNLOADED_MESSAGE[platform]);
      if (result === "shared") setMessage("「ホーム画面に設定する方法」の手順で、壁紙に設定できます。");
    });
  };

  const index = WALLPAPER_IDS.indexOf(id);
  const prev = WALLPAPER_IDS[index - 1];
  const next = WALLPAPER_IDS[index + 1];
  // LINE などのアプリの中では保存できないことがあるので、「保存できます」とは書かず、下の案内へ誘う
  const note = loaded === "error"
    ? "壁紙を読み込めませんでした。通信状況を確かめて、もう一度読み込んでください"
    : inAppBrowser
      ? "保存できないときは、下の案内を見てください"
      : DOWNLOAD_NOTE[platform];

  return (
    <main className="progress-page">
      <div className="progress-content">
        <div className="progress-sub-header-row">
          {/* 一覧から開いたときは履歴を1つ戻る（戻ったあと、端末の「戻る」で進捗のトップへ戻れるように）。
              URL を直接開いたときは、一覧へ移る */}
          <Link
            className="progress-sub-back"
            to="/progress/wallpaper"
            replace
            onClick={(event) => {
              if (!fromList) return;
              event.preventDefault();
              navigate(-1);
            }}
          >
            <span className="progress-sub-back-icon" aria-hidden="true">←</span>
            壁紙一覧に戻る
          </Link>
        </div>

        <h1 className="wallpaper-detail-title">No.{id}</h1>

        {/* 前・次の壁紙で画像を挟む。戻るボタンで一覧に戻れるよう、履歴を積まずに切り替える */}
        <div className="wallpaper-detail">
          {prev ? (
            <Link className="wallpaper-step" to={`/progress/wallpaper/${prev}`} replace state={fromList ? WALLPAPER_LINK_STATE : undefined} aria-label={`前の壁紙（No.${prev}）`}>
              <Chevron direction="left" />
            </Link>
          ) : <span className="wallpaper-step is-empty" aria-hidden="true" />}

          <div className="wallpaper-detail-frame">
            {loaded === "error" ? (
              <span className="wallpaper-image is-error">
                <span className="wallpaper-image-error">読み込めませんでした</span>
              </span>
            ) : loaded ? (
              // iPhone は読み込んだ画像をそのまま出す（長押しの「"写真"に保存」で同じ画像が入る）。
              // Android・PC は API の画像を出す（Chrome は端末の中の画像を長押しで保存しにくいため）
              <WallpaperImage
                src={platform === "ios" ? loaded.url : getWallpaperUrl(id)}
                fallbackSrc={platform === "ios" ? undefined : loaded.url}
                alt={`壁紙 No.${id}`}
                allowSave
              />
            ) : (
              <span className="wallpaper-image is-loading" />
            )}
          </div>

          {next ? (
            <Link className="wallpaper-step" to={`/progress/wallpaper/${next}`} replace state={fromList ? WALLPAPER_LINK_STATE : undefined} aria-label={`次の壁紙（No.${next}）`}>
              <Chevron direction="right" />
            </Link>
          ) : <span className="wallpaper-step is-empty" aria-hidden="true" />}
        </div>

        <div className="wallpaper-download">
          <button
            type="button"
            className="wallpaper-download-button"
            disabled={loaded === null || saving}
            onClick={handleSave}
          >
            {loaded === "error" ? "もう一度読み込む" : loaded ? "壁紙をダウンロード" : "準備中…"}
          </button>
          {note && (
            <p className={`wallpaper-download-note${loaded === "error" ? " is-error" : ""}`} role={loaded === "error" ? "alert" : undefined}>
              {note}
            </p>
          )}
          {message && <p className="wallpaper-download-note" role="status">{message}</p>}
        </div>

        {/* LINE などのアプリの中のブラウザでの案内。画像とボタンが1画面に収まるよう、ボタンの下に出す */}
        <WallpaperInAppNotice />

        <WallpaperHowTo />
      </div>

      <BottomNavigation active="progress" />
    </main>
  );
}

export default ProgressWallpaperDetail;

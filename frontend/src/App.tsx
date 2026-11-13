import { Suspense, lazy, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  Navigate,
  useLocation,
} from "react-router-dom";

// 最初に開く画面だけ先に読み込み、残りはその画面を開いたときに読み込む（初回に落とすJSを小さくする）
import Home from "./pages/Home/Home";
import CampusSelection from "./pages/CampusSelection/CampusSelection";
import Title from "./pages/Title/Title";
import GameTutorial from "./components/Tutorial/GameTutorial";

const QuestLoading = lazy(() => import("./pages/QuestLoading/QuestLoading"));
const QrEntry = lazy(() => import("./pages/QrEntry/QrEntry"));
const Map = lazy(() => import("./pages/Map/Map"));
const Progress = lazy(() => import("./pages/Progress/Progress"));
const ProgressWeapons = lazy(() => import("./pages/Progress/ProgressWeapons"));
const ProgressStickers = lazy(() => import("./pages/Progress/ProgressStickers"));
const ProgressWallpaper = lazy(() => import("./pages/Progress/ProgressWallpaper"));
const ProgressWallpaperDetail = lazy(() => import("./pages/Progress/ProgressWallpaperDetail"));
const ProgressFields = lazy(() => import("./pages/Progress/ProgressFields"));
const QRScanner = lazy(() => import("./pages/QRScanner/QRScanner.tsx"));
const Battle = lazy(() => import("./pages/Battle/Battle.tsx"));
const Result = lazy(() => import("./pages/Result/Result.tsx"));
const Collection = lazy(() => import("./pages/Collection/Collection.tsx"));
const Exchange = lazy(() => import("./pages/Exchange/Exchange.tsx"));
const NoveltyRedeem = lazy(() => import("./pages/NoveltyRedeem/NoveltyRedeem.tsx"));
import { GameProvider, useGame } from "./context/GameContext";
import { BattleSessionProvider } from "./context/BattleSessionContext";
import { QrNoticeProvider } from "./context/QrNoticeProvider";
import { QUEST_QR_PATH } from "./utils/questQr";
import { preloadSounds, startBgm, stopBgm } from "./utils/sound";

import "./App.css";

// 画面を遅延読み込みしている間の下地（一瞬だけ別の色が出ないようにする）
function RouteFallback() {
  return <div className="route-fallback" aria-hidden="true" />;
}

// クエストが変わったら Battle を作り直し、表示メッセージなど画面内の状態を初期化する
function BattleRoute() {
  const { questId } = useParams();

  return <Battle key={questId} />;
}

// クエストが変わったら Result を作り直し、前のクエストの入場チェック結果を引き継がない
function ResultRoute() {
  const { questId } = useParams();

  return <Result key={questId} />;
}
// 以前の /stamps は /progress/fields にまとめた（#field-1 などの位置の指定も引き継ぐ）
function StampsRedirect() {
  const { search, hash } = useLocation();
  return <Navigate to={`/progress/fields${search}${hash}`} replace />;
}
function HomeEntry() {
  const { campusId } = useGame();
  // まだエリアを選んでいない（初めて開いた）ときは、タイトル画面から始める
  return campusId ? <Home /> : <Navigate to="/title" replace />;
}

// エリアを選んでいる間は、どの画面でもBGMを流す（開き直したときは、最初のタップで流れ始める）
function BackgroundMusic() {
  const { campusId } = useGame();

  useEffect(() => {
    if (!campusId) return;
    preloadSounds();
    startBgm();
    return () => stopBgm();
  }, [campusId]);

  return null;
}

function App() {
  return (
    <GameProvider>
      <BackgroundMusic />
      <BattleSessionProvider>
        <BrowserRouter>
          <div className="app">
            <QrNoticeProvider>
            <GameTutorial>
              <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<HomeEntry />} />
                <Route path="/title" element={<Title />} />
                <Route path="/start" element={<CampusSelection />} />
                {/* 以前あった校舎（建物）選択の画面。エリアの全建物を遊べるようにしたので、ホームへ転送する */}
                <Route path="/start/buildings" element={<Navigate to="/" replace />} />
                <Route path="/quest-loading/:questId" element={<QuestLoading />} />
                {/* 標準カメラで会場のQRコードを開いたときの受け口（QRの中身は https://ドメイン/q/QUEST_OSAKA_1） */}
                <Route path={`${QUEST_QR_PATH}:code`} element={<QrEntry />} />

                <Route
                  path="/map"
                  element={<Map />}
                />

                <Route
                  path="/progress"
                  element={<Progress />}
                />

                <Route
                  path="/qr-scanner"
                  element={<QRScanner />}
                />

                <Route
                  path="/battle/:questId"
                  element={<BattleRoute />}
                />

                <Route
                  path="/result/:questId"
                  element={<ResultRoute />}
                />

                {/* 以前あった素材一覧。素材をなくしたので、ホームへ転送する */}
                <Route path="/materials" element={<Navigate to="/" replace />} />
                <Route path="/progress/weapons" element={<ProgressWeapons />} />
                <Route path="/progress/stickers" element={<ProgressStickers />} />
                <Route path="/progress/wallpaper" element={<ProgressWallpaper />} />
                <Route path="/progress/wallpaper/:wallpaperId" element={<ProgressWallpaperDetail />} />
                <Route path="/progress/fields" element={<ProgressFields />} />
                <Route path="/stamps" element={<StampsRedirect />} />
                <Route path="/history" element={<Collection view="history" />} />
                <Route path="/exchange/weapon" element={<Exchange />} />
                <Route path="/novelty/:fieldId" element={<NoveltyRedeem />} />
              </Routes>
              </Suspense>
            </GameTutorial>
            </QrNoticeProvider>
          </div>
        </BrowserRouter>
      </BattleSessionProvider>
    </GameProvider>
  );
}

export default App;

import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  Navigate,
  useLocation,
} from "react-router-dom";

import Home from "./pages/Home/Home";
import CampusSelection from "./pages/CampusSelection/CampusSelection";
import BuildingSelection from "./pages/BuildingSelection/BuildingSelection";
import QuestLoading from "./pages/QuestLoading/QuestLoading";
import GameTutorial from "./components/Tutorial/GameTutorial";
import { useGameTutorial } from "./components/Tutorial/useGameTutorial";
import Map from "./pages/Map/Map";
import Progress from "./pages/Progress/Progress";
import ProgressWeapons from "./pages/Progress/ProgressWeapons";
import ProgressStickers from "./pages/Progress/ProgressStickers";
import ProgressWallpaper from "./pages/Progress/ProgressWallpaper";
import ProgressFields from "./pages/Progress/ProgressFields";
import QRScanner from "./pages/QRScanner/QRScanner.tsx";
import Battle from "./pages/Battle/Battle.tsx";
import Result from "./pages/Result/Result.tsx";
import Collection from "./pages/Collection/Collection.tsx";
import Exchange from "./pages/Exchange/Exchange.tsx";
import NoveltyRedeem from "./pages/NoveltyRedeem/NoveltyRedeem.tsx";
import { GameProvider, useGame } from "./context/GameContext";
import { BattleSessionProvider } from "./context/BattleSessionContext";

import "./App.css";

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
  const { campusId, buildingId } = useGame();
  const { active } = useGameTutorial();
  if (!campusId) return <Navigate to="/start" replace />;
  // 校舎（号館）をまだ選んでいないときは、先に選んでもらう。
  // 練習中は途中の画面から戻ってこられるように、そのまま表示する
  if (!active && buildingId === null) return <Navigate to="/start/buildings" replace />;
  return <Home />;
}

function App() {
  return (
    <GameProvider>
      <BattleSessionProvider>
        <BrowserRouter>
          <div className="app">
            <GameTutorial>
              <Routes>
                <Route path="/" element={<HomeEntry />} />
                <Route path="/start" element={<CampusSelection />} />
                <Route path="/start/buildings" element={<BuildingSelection />} />
                <Route path="/quest-loading/:questId" element={<QuestLoading />} />

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

                <Route path="/materials" element={<Collection view="materials" />} />
                <Route path="/progress/weapons" element={<ProgressWeapons />} />
                <Route path="/progress/stickers" element={<ProgressStickers />} />
                <Route path="/progress/wallpaper" element={<ProgressWallpaper />} />
                <Route path="/progress/fields" element={<ProgressFields />} />
                <Route path="/stamps" element={<StampsRedirect />} />
                <Route path="/history" element={<Collection view="history" />} />
                <Route path="/exchange/weapon" element={<Exchange />} />
                <Route path="/novelty/:fieldId" element={<NoveltyRedeem />} />
              </Routes>
            </GameTutorial>
          </div>
        </BrowserRouter>
      </BattleSessionProvider>
    </GameProvider>
  );
}

export default App;

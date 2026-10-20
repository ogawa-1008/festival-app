import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  Navigate,
} from "react-router-dom";

import Home from "./pages/Home/Home";
import CampusSelection from "./pages/CampusSelection/CampusSelection";
import QuestLoading from "./pages/QuestLoading/QuestLoading";
import GameTutorial from "./components/Tutorial/GameTutorial";
import Map from "./pages/Map/Map";
import Progress from "./pages/Progress/Progress";
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
function HomeEntry() {
  const { campusId } = useGame();
  return campusId ? <Home /> : <Navigate to="/start" replace />;
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
                <Route path="/stamps" element={<Collection view="stamps" />} />
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

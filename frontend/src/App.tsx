import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
} from "react-router-dom";

import Home from "./pages/Home/Home";
import Map from "./pages/Map/Map";
import Progress from "./pages/Progress/Progress";
import QRScanner from "./pages/QRScanner/QRScanner.tsx";
import Battle from "./pages/Battle/Battle.tsx";
import Result from "./pages/Result/Result.tsx";
import Collection from "./pages/Collection/Collection.tsx";
import Exchange from "./pages/Exchange/Exchange.tsx";

import { GameProvider } from "./context/GameContext";
import { BattleSessionProvider } from "./context/BattleSessionContext";

import "./App.css";

// クエストが変わったら Battle を作り直し、HP・残り手数を初期化する
function BattleRoute() {
  const { questId } = useParams();

  return <Battle key={questId} />;
}

function App() {
  return (
    <GameProvider>
      <BattleSessionProvider>
        <BrowserRouter>
          <div className="app">
            <Routes>
              <Route path="/" element={<Home />} />

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
                element={<Result />}
              />

              <Route path="/materials" element={<Collection view="materials" />} />
              <Route path="/stamps" element={<Collection view="stamps" />} />
              <Route path="/history" element={<Collection view="history" />} />
              <Route path="/exchange/weapon" element={<Exchange />} />
            </Routes>
          </div>
        </BrowserRouter>
      </BattleSessionProvider>
    </GameProvider>
  );
}

export default App;

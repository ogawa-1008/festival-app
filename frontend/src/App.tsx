import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Home from "./pages/Home/Home";
import CampusSelection from "./pages/CampusSelection/CampusSelection";
import Map from "./pages/Map/Map";
import Progress from "./pages/Progress/Progress";
import QRScanner from "./pages/QRScanner/QRScanner.tsx";
import Battle from "./pages/Battle/Battle.tsx";
import Result from "./pages/Result/Result.tsx";
import Collection from "./pages/Collection/Collection.tsx";
import Exchange from "./pages/Exchange/Exchange.tsx";

import { GameProvider, useGame } from "./context/GameContext";

import "./App.css";

function HomeEntry() {
  const { campusId } = useGame();
  return campusId ? <Home /> : <Navigate to="/start" replace />;
}

function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <div className="app">
          <Routes>
            <Route path="/" element={<HomeEntry />} />
            <Route path="/start" element={<CampusSelection />} />

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
              element={<Battle />}
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
    </GameProvider>
  );
}

export default App;

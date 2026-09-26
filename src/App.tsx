import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Home from "./pages/Home/Home";
import Map from "./pages/Map/Map";
import Progress from "./pages/Progress/Progress";
import QRScanner from "./pages/QRScanner/QRScanner.tsx";
import Battle from "./pages/Battle/Battle.tsx";
import Result from "./pages/Result/Result.tsx";

import { GameProvider } from "./context/GameContext";

import "./App.css";

function App() {
  return (
    <GameProvider>
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
              element={<Battle />}
            />

            <Route
              path="/result/:questId"
              element={<Result />}
            />
          </Routes>
        </div>
      </BrowserRouter>
    </GameProvider>
  );
}

export default App;
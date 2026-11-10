import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles/global.css";

import App from "./App";
import { installSoundUnlock } from "./utils/sound";
import { installImageProtection } from "./utils/protectImages";
import { trackVisit } from "./utils/visitTracker";

installSoundUnlock();
installImageProtection();
// 来場者数（UU）を数える。画面の表示を待たせないよう、結果は待たない
void trackVisit();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles/global.css";

import App from "./App";
import { installSoundUnlock } from "./utils/sound";
import { installImageProtection } from "./utils/protectImages";

installSoundUnlock();
installImageProtection();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
/// <reference types="vite/client" />

interface ImportMetaEnv {
  // API（スマホ壁紙の画像など）の接続先（例: https://api.example.com）。未設定なら同じドメインの /api
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

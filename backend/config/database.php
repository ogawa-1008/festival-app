<?php

// DB 接続設定。backend/.env（git 管理外）の値で上書きできる。
// 本番（Xserver）では .env に本番 DB の接続情報を入れる。
// 既定値はローカル開発用（README の docker コマンドで立てる MariaDB に合わせてある）。
return [
    'dsn' => $_ENV['DB_DSN'] ?? 'mysql:host=127.0.0.1;port=3307;dbname=festival;charset=utf8mb4',
    'user' => $_ENV['DB_USER'] ?? 'festival',
    'password' => $_ENV['DB_PASSWORD'] ?? 'festival',
];

<?php

// 本番（Xserver）の /api/ の入り口。ビルドすると dist/api/index.php になり、public_html/api/ に置かれる。
// API 本体（backend）は、ブラウザから直接見えない public_html の外の festival-api/ に置いてある
// （public_html/api/ から2つ上が /vantan-monhan-festival.com/）。
// 開発中は Vite の proxy が /api を backend に転送するので、このファイルは使わない
require __DIR__ . '/../../festival-api/public/index.php';

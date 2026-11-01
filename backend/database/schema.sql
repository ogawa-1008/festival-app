-- festival-app: ノベルティ（ステッカー）在庫テーブル
-- 使い方: 開発環境は `docker exec -i ... < database/schema.sql`、
--         本番（Xserver）は phpMyAdmin などでインポートする。

-- 在庫はエリア（大阪・東京・名古屋）ごとに 1 行。号館ごとには分けない
-- （討伐した号館と交換する号館がちがっても、エリアの在庫と配った枚数がずれないように）
CREATE TABLE IF NOT EXISTS campus_novelty_stock (
    campus_id VARCHAR(20) NOT NULL,
    remaining INT NOT NULL DEFAULT 0,
    PRIMARY KEY (campus_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 初期在庫: エリアごとに 1000（仮の枚数。決まったら UPDATE で直す）
-- campus_id はフロントのエリアの ID（osaka / tokyo / nagoya）と同じにする
-- IGNORE なので再実行しても既存の残数（減算済みの値）は上書きしない
INSERT IGNORE INTO campus_novelty_stock (campus_id, remaining) VALUES
    ('osaka', 1000), ('tokyo', 1000), ('nagoya', 1000);

-- 号館ごとに在庫を持っていた前のテーブルは使わない。新しい API に切り替えたあとで消す:
--   DROP TABLE IF EXISTS novelty_stock;

-- 枚数を変えたいとき・開発中に残数をリセットしたいとき:
--   UPDATE campus_novelty_stock SET remaining = 1000;
--   UPDATE campus_novelty_stock SET remaining = 1200 WHERE campus_id = 'tokyo';

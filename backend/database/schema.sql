-- festival-app: ノベルティ（フィールド配布ステッカー）在庫テーブル
-- 使い方: 開発環境は `docker exec -i ... < database/schema.sql`、
--         本番（Xserver）は phpMyAdmin などでインポートする。

CREATE TABLE IF NOT EXISTS novelty_stock (
    campus_id VARCHAR(20) NOT NULL,
    field_id  INT UNSIGNED NOT NULL,
    remaining INT NOT NULL DEFAULT 0,
    PRIMARY KEY (campus_id, field_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 初期在庫: 校舎 × フィールド（号館の番号）ごとに 500
-- フロントの frontend/src/data/campuses/*.ts の号館と同じ番号にする
-- IGNORE なので再実行しても既存の残数（減算済みの値）は上書きしない
INSERT IGNORE INTO novelty_stock (campus_id, field_id, remaining) VALUES
    ('tokyo', 1, 500), ('tokyo', 3, 500), ('tokyo', 4, 500), ('tokyo', 5, 500), ('tokyo', 6, 500), ('tokyo', 7, 500), ('tokyo', 9, 500),
    ('osaka', 1, 500), ('osaka', 2, 500), ('osaka', 3, 500), ('osaka', 5, 500), ('osaka', 6, 500),
    ('nagoya', 1, 500), ('nagoya', 2, 500), ('nagoya', 3, 500);

-- 号館の番号に合わせる前の行（使わない番号）を消したいとき:
--   DELETE FROM novelty_stock WHERE (campus_id, field_id) IN (('osaka', 4), ('tokyo', 2), ('nagoya', 4));

-- 開発中に残数をリセットしたいとき:
--   UPDATE novelty_stock SET remaining = 500;

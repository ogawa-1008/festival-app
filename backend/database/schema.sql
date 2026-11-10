-- festival-app: API のテーブル定義
-- 使い方: 開発環境は `docker exec -i ... < database/schema.sql`、
--         本番（Xserver）は phpMyAdmin などでインポートする。
-- 何度実行しても、今あるテーブルとデータは変わらない（CREATE TABLE IF NOT EXISTS）。

-- 来場者数（UU）: アプリを開いた端末のランダムな ID を、日本時間の日付ごとに1行だけ残す
-- （名前・IP などは残さない。集計の SQL は docs/deploy.md の「来場者数（UU）の集計」）
CREATE TABLE IF NOT EXISTS site_visits (
    visit_date DATE NOT NULL,
    visitor_id CHAR(36) NOT NULL,
    first_seen_at DATETIME NOT NULL,
    PRIMARY KEY (visit_date, visitor_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ステッカーの在庫（campus_novelty_stock）は、アナログのスタンプラリーでも同じステッカーを配ることになり、
-- アプリで数えるのをやめた。前に作った DB に残っているテーブルは使わないので、消してよい:
--   DROP TABLE IF EXISTS campus_novelty_stock;
--   DROP TABLE IF EXISTS novelty_stock;

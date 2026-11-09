-- festival-app: API のテーブル定義
-- 使い方: 開発環境は `docker exec -i ... < database/schema.sql`、
--         本番（Xserver）は phpMyAdmin などでインポートする。

-- 今の API は DB を使わない（テーブルはない）。アクセスの集計などでテーブルが要るときに、ここへ書く。

-- ステッカーの在庫（campus_novelty_stock）は、アナログのスタンプラリーでも同じステッカーを配ることになり、
-- アプリで数えるのをやめた。前に作った DB に残っているテーブルは使わないので、消してよい:
--   DROP TABLE IF EXISTS campus_novelty_stock;
--   DROP TABLE IF EXISTS novelty_stock;

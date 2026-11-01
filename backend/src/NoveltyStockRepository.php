<?php

declare(strict_types=1);

namespace App;

use PDO;

/**
 * ノベルティ（ステッカー）の在庫リポジトリ（MariaDB）。
 * 在庫はエリア（大阪・東京・名古屋）ごとに持つ。どの号館で交換しても、そのエリアの在庫から減らす。
 */
final class NoveltyStockRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    /**
     * エリアの残数を返す。未知のエリア（行なし）なら null。
     */
    public function remaining(string $campusId): ?int
    {
        $statement = $this->pdo->prepare(
            'SELECT remaining FROM campus_novelty_stock WHERE campus_id = :campus_id'
        );
        $statement->execute(['campus_id' => $campusId]);
        $remaining = $statement->fetchColumn();

        return $remaining === false ? null : (int) $remaining;
    }

    /**
     * 残数を1減らす（交換）。在庫がマイナスになることはない。
     *
     * 成功: ['ok' => true, 'remaining' => 新しい残数]
     * 失敗: ['ok' => false, 'reason' => 'not_found'（エリアが無い）| 'out_of_stock'（残数0）]
     *
     * @return array{ok: true, remaining: int}|array{ok: false, reason: string}
     */
    public function redeem(string $campusId): array
    {
        // 減らしたあとの残数を LAST_INSERT_ID に入れて、同じ更新の値を読む
        // （更新のあとに別に SELECT すると、同時に交換した人の分まで減った値を返すことがあるため）
        $update = $this->pdo->prepare(
            'UPDATE campus_novelty_stock SET remaining = LAST_INSERT_ID(remaining - 1)
             WHERE campus_id = :campus_id AND remaining > 0'
        );
        $update->execute(['campus_id' => $campusId]);

        if ($update->rowCount() === 0) {
            return $this->remaining($campusId) === null
                ? ['ok' => false, 'reason' => 'not_found']
                : ['ok' => false, 'reason' => 'out_of_stock'];
        }

        // 同じ接続で SELECT LAST_INSERT_ID() を聞き直す（MySQL のマニュアルの手本の形）。
        // PDO::lastInsertId() でも読めるが、UPDATE のあとに値を返すかは DB をつなぐ部品しだいのため使わない
        $remaining = $this->pdo->query('SELECT LAST_INSERT_ID()')->fetchColumn();

        return ['ok' => true, 'remaining' => (int) $remaining];
    }
}

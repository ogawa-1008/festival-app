<?php

declare(strict_types=1);

namespace App;

use PDO;

/**
 * ノベルティ（フィールド配布ステッカー）の在庫リポジトリ（MariaDB）。
 */
final class NoveltyStockRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    /**
     * 校舎のステッカー別残数を返す。未知の校舎（行なし）なら null。
     *
     * @return array{campus: string, novelties: list<array{fieldId: int, remaining: int}>}|null
     */
    public function forCampus(string $campusId): ?array
    {
        $statement = $this->pdo->prepare(
            'SELECT field_id, remaining FROM novelty_stock WHERE campus_id = :campus_id ORDER BY field_id'
        );
        $statement->execute(['campus_id' => $campusId]);

        $rows = $statement->fetchAll();
        if ($rows === []) {
            return null;
        }

        $novelties = [];
        foreach ($rows as $row) {
            $novelties[] = [
                'fieldId' => (int) $row['field_id'],
                'remaining' => (int) $row['remaining'],
            ];
        }

        return ['campus' => $campusId, 'novelties' => $novelties];
    }

    /**
     * 残数を1減らす（交換）。在庫がマイナスになることはない。
     *
     * 成功: ['ok' => true, 'remaining' => 新しい残数]
     * 失敗: ['ok' => false, 'reason' => 'not_found'（校舎/フィールドが無い）| 'out_of_stock'（残数0）]
     *
     * @return array{ok: true, remaining: int}|array{ok: false, reason: string}
     */
    public function redeem(string $campusId, int $fieldId): array
    {
        $update = $this->pdo->prepare(
            'UPDATE novelty_stock SET remaining = remaining - 1
             WHERE campus_id = :campus_id AND field_id = :field_id AND remaining > 0'
        );
        $update->execute(['campus_id' => $campusId, 'field_id' => $fieldId]);

        $select = $this->pdo->prepare(
            'SELECT remaining FROM novelty_stock WHERE campus_id = :campus_id AND field_id = :field_id'
        );
        $select->execute(['campus_id' => $campusId, 'field_id' => $fieldId]);
        $remaining = $select->fetchColumn();

        if ($remaining === false) {
            return ['ok' => false, 'reason' => 'not_found'];
        }

        if ($update->rowCount() === 0) {
            return ['ok' => false, 'reason' => 'out_of_stock'];
        }

        return ['ok' => true, 'remaining' => (int) $remaining];
    }
}

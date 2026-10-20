<?php

declare(strict_types=1);

namespace App;

/**
 * ノベルティ（フィールド配布ステッカー）の在庫。
 *
 * 現在は固定値（config/novelties.php）を渡されて読むだけ。
 * 実在庫の管理（交換による減算・永続化）に切り替えるときは、このクラスを置き換える。
 */
final class NoveltyStock
{
    /** @param array<string, array<int, int>> $stock 校舎ID => [フィールドID => 残数] */
    public function __construct(private array $stock)
    {
    }

    /**
     * 校舎のステッカー別残数を返す。未知の校舎なら null。
     *
     * @return array{campus: string, novelties: list<array{fieldId: int, remaining: int}>}|null
     */
    public function forCampus(string $campusId): ?array
    {
        if (!isset($this->stock[$campusId])) {
            return null;
        }

        $novelties = [];
        foreach ($this->stock[$campusId] as $fieldId => $remaining) {
            $novelties[] = ['fieldId' => $fieldId, 'remaining' => $remaining];
        }

        return ['campus' => $campusId, 'novelties' => $novelties];
    }
}

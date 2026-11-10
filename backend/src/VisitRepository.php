<?php

declare(strict_types=1);

namespace App;

use DateTimeImmutable;
use DateTimeZone;
use PDO;

/**
 * 来場者数（UU）の記録。端末ごとのランダムな ID を、日本時間の日付ごとに1行だけ残す。
 * 同じ日に同じ ID が何度来ても増えない（集計は phpMyAdmin で COUNT する。docs/deploy.md）。
 */
final class VisitRepository
{
    private const UUID_PATTERN = '/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\z/';

    public function __construct(private PDO $pdo)
    {
    }

    public static function isValidVisitorId(mixed $visitorId): bool
    {
        return is_string($visitorId) && preg_match(self::UUID_PATTERN, $visitorId) === 1;
    }

    public function record(string $visitorId): void
    {
        // サーバーの時刻の地域に関係なく、日本時間で日付を決める（フロントの「今日送ったか」と合わせる）
        $now = new DateTimeImmutable('now', new DateTimeZone('Asia/Tokyo'));

        $statement = $this->pdo->prepare(
            'INSERT IGNORE INTO site_visits (visit_date, visitor_id, first_seen_at) VALUES (:date, :id, :seen)'
        );
        $statement->execute([
            'date' => $now->format('Y-m-d'),
            'id' => $visitorId,
            'seen' => $now->format('Y-m-d H:i:s'),
        ]);
    }
}

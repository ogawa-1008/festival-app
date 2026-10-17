import { useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { useBattleSession } from "../../context/BattleSessionContext";
import { useGame } from "../../context/GameContext";
import { useSessionScreen } from "../../context/useSessionScreen";
import {
    BATTLE_MAX_HP,
    type BattleSession,
    type EndReason,
    type Hand,
    type RoundResult,
    TURN_COOLDOWN_MS,
} from "../../utils/battleSession";

import { useCooldown } from "./useCooldown";

import "./Battle.css";

const START_MESSAGE = "じゃんけんでモンスターを倒せ！";

const END_MESSAGES: Record<EndReason, string> = {
    victory: "モンスターを討伐した！",
    defeated: "力尽きてしまった……",
    timeout: "モンスターは逃げてしまった……",
};

const ROUND_MESSAGES: Record<RoundResult, string> = {
    draw: "あいこ！ もう一度！",
    player: "勝利！ モンスターにダメージ！",
    enemy: "敗北…… ダメージを受けた！",
};

const HAND_LABELS: Record<Hand, string> = {
    rock: "グー",
    scissors: "チョキ",
    paper: "パー",
};

// メッセージはセッションから組み立てる（再読み込み後も直前の手と勝敗を表示できる）
function getBattleMessage(session: BattleSession) {
    const { lastRound, endReason } = session;

    const hands = lastRound
        ? `あなた: ${HAND_LABELS[lastRound.playerHand]} / モンスター: ${HAND_LABELS[lastRound.enemyHand]}`
        : null;

    // 以前の形式のセッションには直前の手が無いため、決着済みかを先に見る
    if (endReason) {
        return { hands, text: END_MESSAGES[endReason] };
    }

    return {
        hands,
        text: lastRound ? ROUND_MESSAGES[lastRound.result] : START_MESSAGE,
    };
}

function Battle() {
    const navigate = useNavigate();
    const { questId } = useParams();

    const { quests } = useGame();
    const { session, playHand } = useBattleSession();
    const screenStatus = useSessionScreen(questId);

    const quest = quests.find(
        (item) => item.id === questId
    );

    const isOwnSession = session !== null && session.questId === questId;
    const endReason = isOwnSession ? session.endReason : null;
    const nextTurnAt = isOwnSession ? session.nextTurnAt : 0;

    // 待ち時間（ターン帯の表示中）か。再読み込み後は残り時間から再開する
    const cooldown = useCooldown(nextTurnAt);

    // 討伐後は少し待ってからリザルトへ。画面を離れたらタイマーを取り消す
    useEffect(() => {
        if (screenStatus !== "ready" || endReason !== "victory" || session?.claimed) return;

        const timerId = setTimeout(() => {
            navigate(`/result/${questId}`);
        }, 1200);

        return () => clearTimeout(timerId);
    }, [screenStatus, endReason, session?.claimed, navigate, questId]);

    if (!quest) {
        return (
            <main className="battle-page">
                <div className="battle-error">
                    <h1>クエストが見つかりません</h1>

                    <button
                        type="button"
                        onClick={() => navigate("/")}
                    >
                        ホームへ戻る
                    </button>
                </div>
            </main>
        );
    }

    // 別タブで開いているかの確認中は何も表示しない
    if (screenStatus === "checking") {
        return null;
    }

    // QRを読み取らずにURLを直接開いた場合・別タブでバトル中の場合は読み取り画面へ戻す
    if (!isOwnSession || screenStatus === "elsewhere") {
        return (
            <Navigate
                to="/qr-scanner"
                replace
                state={{
                    message: screenStatus === "elsewhere"
                        ? "このバトルは別のタブで開いています。\nこのタブで続けるにはQRコードを読み取ってください"
                        : "QRコードを読み取ってください",
                }}
            />
        );
    }

    // 報酬受け取り済みの1戦には戻れない
    if (session.claimed) {
        return <Navigate to="/" replace />;
    }

    const { playerHp, monsterHp, turnsLeft } = session;
    const isBattleOver = endReason !== null;
    const isWaiting = !isBattleOver && cooldown.isWaiting;
    // 次に迎えるターン（あいこも1ターンとして数える）
    const turnNumber = session.maxTurns - turnsLeft + 1;
    // 再読み込みで途中から表示する場合も、帯の動きを残り時間に合わせる
    const bannerElapsed = Math.max(0, TURN_COOLDOWN_MS - cooldown.remaining);
    const message = getBattleMessage(session);

    const handleHandSelect = (playerHand: Hand) => {
        // 終了済み・待ち時間中なら null が返る（連打を防ぐガード）
        playHand(playerHand);
    };

    return (
        <main className="battle-page">
            {/* 残り1手 or HP1（あと1回で終わる状況）で画面の縁に赤いモヤ */}
            {(turnsLeft === 1 || playerHp === 1) && !isBattleOver && (
                <div
                    className="battle-danger-overlay"
                    aria-hidden="true"
                />
            )}

            {/* 待ち時間中は画面中央に「Nターン目」の帯を出す */}
            {isWaiting && (
                <div
                    key={turnNumber}
                    className="battle-turn-banner"
                    aria-hidden="true"
                    style={{
                        animationDuration: `${TURN_COOLDOWN_MS}ms`,
                        animationDelay: `-${bannerElapsed}ms`,
                    }}
                >
                    <span>{turnNumber}ターン目</span>
                </div>
            )}

            {/* 帯は毎回作り直すため、読み上げは常設の領域で行う */}
            <div className="battle-sr-only" aria-live="polite">
                {isWaiting ? `${turnNumber}ターン目` : ""}
            </div>

            <div className="battle-content">

                {/* =========================
            HEADER
        ========================= */}

                <header className="battle-header">
                    <span className="battle-subtitle">
                        HUNTING BATTLE
                    </span>

                    <h1>狩猟開始</h1>
                </header>


                {/* =========================
            QUEST NAME
        ========================= */}

                <section className="battle-quest">
                    <span>QUEST</span>

                    <h2>{quest.title}</h2>
                </section>


                {/* =========================
            MONSTER
        ========================= */}

                <section className="monster-area">

                    <div className="monster-name">
                        MONSTER
                    </div>

                    <div className="monster-image-frame">
                        <img
                            src="/images/battle/D922CBBD-1F61-473A-8B25-F9649791B986.png"
                            alt="モンスター"
                            className="monster-image"
                        />
                    </div>

                    <div className="monster-hp">
                        <span>MONSTER HP</span>

                        <div className="hp-bar">
                            <div
                                className="hp-fill monster-hp-fill"
                                style={{
                                    width: `${(monsterHp / BATTLE_MAX_HP) * 100
                                        }%`,
                                }}
                            />
                        </div>

                        <div className="hp-number">
                            {monsterHp} / {BATTLE_MAX_HP}
                        </div>
                    </div>

                </section>


                {/* =========================
            MESSAGE
        ========================= */}

                <section className="battle-message">
                    {message.hands && (
                        <span className="battle-message-hands">
                            {message.hands}
                        </span>
                    )}

                    <span>{message.text}</span>
                </section>

                {/* =========================
            PLAYER HP
        ========================= */}

                <section className="player-status">

                    <div className="player-name">
                        HUNTER
                    </div>

                    <div className="player-hp">
                        <div className="hp-bar">
                            <div
                                className="hp-fill player-hp-fill"
                                style={{
                                    width: `${(playerHp / BATTLE_MAX_HP) * 100
                                        }%`,
                                }}
                            />
                        </div>

                        <span>
                            HP {playerHp} / {BATTLE_MAX_HP}
                        </span>
                    </div>

                    <div
                        className={`battle-turns${
                            turnsLeft <= 1 ? " battle-turns-warning" : ""
                        }`}
                    >
                        <span>残り</span>
                        <strong>{turnsLeft}</strong>
                        <span>/ {session.maxTurns} 手</span>
                    </div>

                </section>


                {/* =========================
            JANKEN
        ========================= */}

                <section className="janken-area">

                    <div className="janken-title">
                        <span>CHOOSE YOUR HAND</span>
                    </div>

                    <div className="janken-buttons">

                        {/* グー */}

                        <button
                            type="button"
                            className="janken-button janken-rock"
                            onClick={() =>
                                handleHandSelect("rock")
                            }
                            disabled={isBattleOver || isWaiting}
                        >
                            <div className="janken-image-frame">
                                <img
                                    src="/images/battle/DDB43F54-277A-4F6D-A089-AE52BEB3477B_4_5005_c.jpeg"
                                    alt="グー"
                                    className="janken-image"
                                />
                            </div>

                            <span>グー</span>
                        </button>


                        {/* チョキ */}

                        <button
                            type="button"
                            className="janken-button janken-scissors"
                            onClick={() =>
                                handleHandSelect("scissors")
                            }
                            disabled={isBattleOver || isWaiting}
                        >
                            <div className="janken-image-frame">
                                <img
                                    src="/images/battle/7B1F7267-94A8-4106-BCD7-7B355D18DDB7_4_5005_c.jpeg"
                                    alt="チョキ"
                                    className="janken-image"
                                />
                            </div>

                            <span>チョキ</span>
                        </button>


                        {/* パー */}

                        <button
                            type="button"
                            className="janken-button janken-paper"
                            onClick={() =>
                                handleHandSelect("paper")
                            }
                            disabled={isBattleOver || isWaiting}
                        >
                            <div className="janken-image-frame">
                                <img
                                    src="/images/battle/B842F13F-0F17-4A80-8342-6487B70C170D_4_5005_c.jpeg"
                                    alt="パー"
                                    className="janken-image"
                                />
                            </div>

                            <span>パー</span>
                        </button>

                    </div>
                </section>


                {/* =========================
            三すくみ
        ========================= */}

                <section className="triangle-section">

                    <div className="triangle-title">
                        <span>JANKEN RULE</span>
                    </div>

                    <div className="triangle-chart">

                        {/* 赤：グー */}

                        <div className="triangle-item triangle-rock">
                            <div className="triangle-circle">
                                <span>グー</span>
                            </div>

                            <span className="triangle-label">
                                ROCK
                            </span>
                        </div>


                        {/* 青：チョキ */}

                        <div className="triangle-item triangle-scissors">
                            <div className="triangle-circle">
                                <span>チョキ</span>
                            </div>

                            <span className="triangle-label">
                                SCISSORS
                            </span>
                        </div>


                        {/* 黄色：パー */}

                        <div className="triangle-item triangle-paper">
                            <div className="triangle-circle">
                                <span>パー</span>
                            </div>

                            <span className="triangle-label">
                                PAPER
                            </span>
                        </div>


                        {/* 矢印 */}

                        <div className="triangle-arrow arrow-one">
                            →
                        </div>

                        <div className="triangle-arrow arrow-two">
                            →
                        </div>

                        <div className="triangle-arrow arrow-three">
                            →
                        </div>

                    </div>
                </section>


                {/* =========================
            RETRY
        ========================= */}

                {(endReason === "defeated" || endReason === "timeout") && (
                    <button
                        type="button"
                        className="battle-retry-button"
                        onClick={() =>
                            navigate(`/result/${quest.id}`)
                        }
                    >
                        調査結果を見る
                    </button>
                )}

            </div>
        </main>
    );
}

export default Battle;

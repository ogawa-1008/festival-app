import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { useBattleSession } from "../../context/BattleSessionContext";
import { useGame } from "../../context/GameContext";
import { useSessionScreen } from "../../context/useSessionScreen";
import {
    BATTLE_MAX_HP,
    type EndReason,
    type Hand,
} from "../../utils/battleSession";

import "./Battle.css";

const START_MESSAGE = "じゃんけんでモンスターを倒せ！";

const END_MESSAGES: Record<EndReason, string> = {
    victory: "モンスターを討伐した！",
    defeated: "力尽きてしまった……",
    timeout: "モンスターは逃げてしまった……",
};

function Battle() {
    const navigate = useNavigate();
    const { questId } = useParams();

    const { quests } = useGame();
    const { session, playHand } = useBattleSession();
    const screenStatus = useSessionScreen(questId);

    const quest = quests.find(
        (item) => item.id === questId
    );

    // 再読み込み時はセッションの状態からメッセージを復元する
    const [message, setMessage] = useState(() =>
        session?.endReason ? END_MESSAGES[session.endReason] : START_MESSAGE
    );

    const isOwnSession = session !== null && session.questId === questId;
    const endReason = isOwnSession ? session.endReason : null;

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

    const handleHandSelect = (playerHand: Hand) => {
        // 終了済みなら null が返る（連打を防ぐガード）
        const round = playHand(playerHand);

        if (!round) return;

        if (round.session.endReason) {
            setMessage(END_MESSAGES[round.session.endReason]);
            return;
        }

        if (round.result === "draw") {
            setMessage("あいこ！ もう一度！");
            return;
        }

        if (round.result === "player") {
            setMessage(
                "勝利！ モンスターにダメージ！"
            );

            return;
        }

        setMessage(
            "敗北…… ダメージを受けた！"
        );
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
                    {message}
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
                            disabled={isBattleOver}
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
                            disabled={isBattleOver}
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
                            disabled={isBattleOver}
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

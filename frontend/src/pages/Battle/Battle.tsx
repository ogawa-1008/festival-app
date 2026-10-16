import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useGame } from "../../context/GameContext";
import { DEFAULT_MAX_TURNS } from "../../types/quest";

import "./Battle.css";

type Hand = "rock" | "scissors" | "paper";

// バトル終了理由（null はバトル中）
type EndReason = "victory" | "defeated" | "timeout";

function Battle() {
    const navigate = useNavigate();
    const { questId } = useParams();

    const { quests } = useGame();

    const quest = quests.find(
        (item) => item.id === questId
    );

    const maxTurns = quest?.maxTurns ?? DEFAULT_MAX_TURNS;

    const [playerHp, setPlayerHp] = useState(3);
    const [monsterHp, setMonsterHp] = useState(3);
    const [turnsLeft, setTurnsLeft] = useState(maxTurns);

    const [message, setMessage] =
        useState("じゃんけんでモンスターを倒せ！");

    const [endReason, setEndReason] =
        useState<EndReason | null>(null);

    const isBattleOver = endReason !== null;

    // stateだとレンダリングが発生しちゃうからRefで同期的に管理する処理
    const hpRef = useRef({ player: 3, monster: 3, turns: maxTurns });
    const isBattleOverRef = useRef(false);

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

    const judgeWinner = (
        player: Hand,
        enemy: Hand
    ) => {
        if (player === enemy) {
            return "draw";
        }

        if (
            (player === "rock" &&
                enemy === "scissors") ||
            (player === "scissors" &&
                enemy === "paper") ||
            (player === "paper" &&
                enemy === "rock")
        ) {
            return "player";
        }

        return "enemy";
    };

    const handleHandSelect = (playerHand: Hand) => {
        if (isBattleOverRef.current) return; // 連打を防ぐガードです

        const hands: Hand[] = [
            "rock",
            "scissors",
            "paper",
        ];

        const enemyHand =
            hands[Math.floor(Math.random() * hands.length)];

        const result = judgeWinner(
            playerHand,
            enemyHand
        );

        // あいこも含めて1手として数える
        const nextTurns = hpRef.current.turns - 1;

        hpRef.current.turns = nextTurns;
        setTurnsLeft(nextTurns);

        if (result === "player") {
            const nextMonsterHp =
                Math.max(0, hpRef.current.monster - 1);

            hpRef.current.monster = nextMonsterHp;
            setMonsterHp(nextMonsterHp);
        }

        if (result === "enemy") {
            const nextPlayerHp =
                Math.max(0, hpRef.current.player - 1);

            hpRef.current.player = nextPlayerHp;
            setPlayerHp(nextPlayerHp);
        }

        // 終了判定は 討伐 → 力尽きた → 手数切れ の優先順
        if (hpRef.current.monster <= 0) {
            setMessage(
                "モンスターを討伐した！"
            );

            isBattleOverRef.current = true;
            setEndReason("victory");

            setTimeout(() => {
                const goldCrown = Math.random() < 0.1;
                navigate(
                    `/result/${quest.id}?outcome=victory${
                        goldCrown ? "&crown=1" : ""
                    }`
                );
            }, 1200);

            return;
        }

        if (hpRef.current.player <= 0) {
            setMessage(
                "力尽きてしまった……"
            );

            isBattleOverRef.current = true;
            setEndReason("defeated");

            return;
        }

        if (nextTurns <= 0) {
            setMessage(
                "モンスターは逃げてしまった……"
            );

            isBattleOverRef.current = true;
            setEndReason("timeout");

            return;
        }

        if (result === "draw") {
            setMessage("あいこ！ もう一度！");
            return;
        }

        if (result === "player") {
            setMessage(
                "勝利！ モンスターにダメージ！"
            );

            return;
        }

        setMessage(
            "敗北…… ダメージを受けた！"
        );
    };

    const handleRetry = () => {
        hpRef.current = { player: 3, monster: 3, turns: maxTurns };
        isBattleOverRef.current = false;

        setPlayerHp(3);
        setMonsterHp(3);
        setTurnsLeft(maxTurns);

        setMessage(
            "じゃんけんでモンスターを倒せ！"
        );

        setEndReason(null);
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
                                    width: `${(monsterHp / 3) * 100
                                        }%`,
                                }}
                            />
                        </div>

                        <div className="hp-number">
                            {monsterHp} / 3
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
                                    width: `${(playerHp / 3) * 100
                                        }%`,
                                }}
                            />
                        </div>

                        <span>
                            HP {playerHp} / 3
                        </span>
                    </div>

                    <div
                        className={`battle-turns${
                            turnsLeft <= 1 ? " battle-turns-warning" : ""
                        }`}
                    >
                        <span>残り</span>
                        <strong>{turnsLeft}</strong>
                        <span>/ {maxTurns} 手</span>
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
                            navigate(
                                `/result/${quest.id}?outcome=failure${
                                    endReason === "timeout" ? "&reason=timeout" : ""
                                }`
                            )
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

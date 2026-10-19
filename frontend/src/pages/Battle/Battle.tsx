import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useGame } from "../../context/GameContext";
import { battleAssets } from "./battleAssets";
import { useGameTutorial } from "../../components/Tutorial/useGameTutorial";

import "./Battle.css";

type Hand = "rock" | "scissors" | "paper";

function Battle() {
    const navigate = useNavigate();
    const { questId } = useParams();

    const { quests } = useGame();
    const { active: practice, advance } = useGameTutorial();
    const [round, setRound] = useState(0);
    const [isResolving, setIsResolving] = useState(false);
    const practiceRound = useRef(0);
    const busy = useRef(false);
    const turnTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const departureTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => () => {
        clearTimeout(turnTimer.current);
        clearTimeout(departureTimer.current);
    }, []);

    const [playerHp, setPlayerHp] = useState(3);
    const [monsterHp, setMonsterHp] = useState(3);

    const [message, setMessage] =
        useState("じゃんけんでモンスターを倒せ！");

    const [isBattleOver, setIsBattleOver] =
        useState(false);

    // stateだとレンダリングが発生しちゃうからRefで同期的に管理する処理
    const hpRef = useRef({ player: 3, monster: 3 });
    const isBattleOverRef = useRef(false);

    const quest = quests.find(
        (item) => item.id === questId
    );

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
        if (isBattleOverRef.current || busy.current) return;

        const hands: Hand[] = [
            "rock",
            "scissors",
            "paper",
        ];

        const playerIndex = hands.indexOf(playerHand);
        // Rehearse a draw, a loss, then three wins using whichever real hand the
        // player chooses. Normal hunts continue to use a random opponent.
        const enemyHand = practice
            ? hands[(playerIndex + (practiceRound.current === 0 ? 0 : practiceRound.current === 1 ? 2 : 1)) % 3]
            : hands[Math.floor(Math.random() * hands.length)];
        if (practice) {
            practiceRound.current += 1;
            setRound(practiceRound.current);
            busy.current = true;
            setIsResolving(true);
            turnTimer.current = setTimeout(() => {
                busy.current = false;
                setIsResolving(false);
            }, 650);
        }

        const result = judgeWinner(
            playerHand,
            enemyHand
        );

        if (result === "draw") {
            setMessage("あいこ！ もう一度！");
            return;
        }

        if (result === "player") {
            const nextMonsterHp =
                Math.max(0, hpRef.current.monster - 1);

            hpRef.current.monster = nextMonsterHp;
            setMonsterHp(nextMonsterHp);

            if (nextMonsterHp <= 0) {
                setMessage(
                    "モンスターを討伐した！"
                );

                isBattleOverRef.current = true;
                setIsBattleOver(true);

                departureTimer.current = setTimeout(() => {
                    const goldCrown = !practice && Math.random() < 0.1;
                    if (practice) advance("battle-finished");
                    navigate(
                        `/result/${quest.id}?outcome=victory${
                            goldCrown ? "&crown=1" : ""
                        }`, { replace: practice }
                    );
                }, 1200);

                return;
            }

            setMessage(
                "勝利！ モンスターにダメージ！"
            );

            return;
        }

        const nextPlayerHp =
            Math.max(0, hpRef.current.player - 1);

        hpRef.current.player = nextPlayerHp;
        setPlayerHp(nextPlayerHp);

        if (nextPlayerHp <= 0) {
            setMessage(
                "力尽きてしまった……"
            );

            isBattleOverRef.current = true;
            setIsBattleOver(true);

            return;
        }

        setMessage(
            "敗北…… ダメージを受けた！"
        );
    };

    return (
        <main className="battle-page">
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
                            src={battleAssets.monster}
                            alt="モンスター"
                            className="monster-image"
                        />
                    </div>

                    <div className="monster-hp" data-tutorial="monster-hp">
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

                <section className="battle-message" key={round} role="status" aria-live="polite">
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

                </section>


                {/* =========================
            JANKEN
        ========================= */}

                <section className="janken-area">

                    <div className="janken-title">
                        <span>CHOOSE YOUR HAND</span>
                    </div>

                    <div className="janken-buttons" data-tutorial="battle-hands">

                        {/* グー */}

                        <button
                            type="button"
                            className="janken-button janken-rock"
                            onClick={() =>
                                handleHandSelect("rock")
                            }
                            disabled={isBattleOver || isResolving}
                        >
                            <div className="janken-image-frame">
                                <img
                                    src={battleAssets.rock}
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
                            disabled={isBattleOver || isResolving}
                        >
                            <div className="janken-image-frame">
                                <img
                                    src={battleAssets.scissors}
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
                            disabled={isBattleOver || isResolving}
                        >
                            <div className="janken-image-frame">
                                <img
                                    src={battleAssets.paper}
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

                {playerHp <= 0 && (
                    <button
                        type="button"
                        className="battle-retry-button"
                        onClick={() =>
                            navigate(`/result/${quest.id}?outcome=failure`)
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

import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGame } from "../../context/GameContext";
import { battleAssets } from "./battleAssets";
import { useGameTutorial } from "../../components/Tutorial/useGameTutorial";
import { chooseEnemyHand, createBattle, getBattleBalance, hunterMaxHp, practiceEnemyHand, resolveTurn, turnFeedbackMs, type Hand } from "../../game/battle";
import "./Battle.css";

function Battle() {
    const { questId } = useParams();
    return <BattleEncounter key={questId} questId={questId} />;
}

function BattleEncounter({ questId }: { questId: string | undefined }) {
    const navigate = useNavigate();
    const { quests } = useGame();
    const { active: practice, advance } = useGameTutorial();
    const quest = quests.find((item) => item.id === questId);
    const balance = getBattleBalance(questId ?? "");
    const [battle, setBattle] = useState(() => createBattle(balance));
    const hpRef = useRef(battle);
    const busy = useRef(false);
    const [isResolving, setIsResolving] = useState(false);
    const turnTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const departureTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => () => {
        clearTimeout(turnTimer.current);
        clearTimeout(departureTimer.current);
    }, []);

    const { playerHp, monsterHp, round } = battle;
    const isBattleOver = battle.status !== "playing";
    const message = battle.status === "victory" ? "モンスターを討伐した！"
        : battle.status === "failure" ? "力尽きてしまった……"
        : battle.outcome === "draw" ? "あいこ！ HPは変わりません"
        : battle.outcome === "player" ? `勝利！ モンスターに${battle.damage}ダメージ！`
        : battle.outcome === "enemy" ? `敗北…… ${battle.damage}ダメージを受けた！`
        : "じゃんけんでモンスターを倒せ！";

    const handleHandSelect = (playerHand: Hand) => {
        if (!quest || hpRef.current.status !== "playing" || busy.current) return;
        busy.current = true;
        setIsResolving(true);
        const enemyHand = practice
            ? practiceEnemyHand(playerHand, hpRef.current.round)
            : chooseEnemyHand();
        // Practice uses the same HP/damage rules with a stable midpoint roll.
        const next = resolveTurn(hpRef.current, balance, playerHand, enemyHand, practice ? () => .5 : Math.random);
        hpRef.current = next;
        setBattle(next);
        turnTimer.current = setTimeout(() => {
            busy.current = false;
            setIsResolving(false);
        }, turnFeedbackMs);
        if (next.status === "victory") {
            departureTimer.current = setTimeout(() => {
                const goldCrown = !practice && Math.random() < .1;
                if (practice) advance("battle-finished");
                navigate(`/result/${quest.id}?outcome=victory${goldCrown ? "&crown=1" : ""}`, { replace: practice });
            }, 1200);
        }
    };

    if (!quest) {
        return <main className="battle-page"><div className="battle-error">
            <h1>クエストが見つかりません</h1>
            <button type="button" onClick={() => navigate("/")}>ホームへ戻る</button>
        </div></main>;
    }

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

                        <div className="hp-bar" role="meter" aria-label="モンスターの体力" aria-valuemin={0} aria-valuemax={balance.monsterMaxHp} aria-valuenow={monsterHp}>
                            <div
                                className="hp-fill monster-hp-fill"
                                style={{
                                    transform: `scaleX(${monsterHp / balance.monsterMaxHp})`,
                                }}
                            />
                        </div>

                        <div className="hp-number">
                            {monsterHp} / {balance.monsterMaxHp}
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
                        <div className="hp-bar" role="meter" aria-label="ハンターの体力" aria-valuemin={0} aria-valuemax={hunterMaxHp} aria-valuenow={playerHp}>
                            <div
                                className="hp-fill player-hp-fill"
                                style={{
                                    transform: `scaleX(${playerHp / hunterMaxHp})`,
                                }}
                            />
                        </div>

                        <span>
                            HP {playerHp} / {hunterMaxHp}
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

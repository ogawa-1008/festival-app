import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { useBattleSession } from "../../context/BattleSessionContext";
import { useGame } from "../../context/GameContext";
import { useGameTutorial } from "../../components/Tutorial/useGameTutorial";
import { battleAssets, getBattleMonsterImage } from "./battleAssets";
import { useSessionScreen } from "../../context/useSessionScreen";
import {
    type BattleSession,
    type EndReason,
    type Hand,
    type RoundResult,
    HUNT_BANNER_MS,
    TURN_COOLDOWN_MS,
} from "../../utils/battleSession";

import JankenRule from "./JankenRule";
import { useCooldown } from "./useCooldown";

import "./Battle.css";

const START_MESSAGE = "じゃんけんでモンスターを倒せ！";
// 勝敗を先に読めるようにしてから、残りの待機時間で次のターンの帯を出す。
const ROUND_RESULT_HOLD_MS = 600;

const END_MESSAGES: Record<EndReason, string> = {
    victory: "モンスターを討伐した！",
    defeated: "力尽きてしまった……",
    timeout: "モンスターは逃げてしまった……",
};

const ROUND_MESSAGES: Record<RoundResult, string> = {
    draw: "もう一度！",
    player: "モンスターにダメージ！",
    enemy: "ダメージを受けた！",
};

const ROUND_LABELS: Record<RoundResult, string> = {
    player: "勝ち！",
    enemy: "負け…",
    draw: "あいこ！",
};

const HAND_LABELS: Record<Hand, string> = {
    rock: "グー",
    scissors: "チョキ",
    paper: "パー",
};

// メッセージはセッションから組み立てる（再読み込み後も直前の手と勝敗を表示できる）
function getBattleMessage(session: BattleSession) {
    const { lastRound, endReason } = session;

    // 以前の形式のセッションには直前の手が無いため、決着済みかを先に見る
    if (endReason) {
        return { text: END_MESSAGES[endReason] };
    }

    return {
        text: !lastRound ? START_MESSAGE : lastRound.result === "draw" ? "HPは変わりません" : lastRound.damage !== undefined
            ? lastRound.result === "player" ? `モンスターに${lastRound.damage}ダメージ！` : `${lastRound.damage}ダメージを受けた！`
            : ROUND_MESSAGES[lastRound.result],
    };
}

function Battle() {
    const navigate = useNavigate();
    const { questId } = useParams();

    const { quests } = useGame();
    const { session, playHand } = useBattleSession();
    const { active: practice, advance } = useGameTutorial();
    const screenStatus = useSessionScreen(questId);

    const quest = quests.find(
        (item) => item.id === questId
    );

    const isOwnSession = session !== null && session.questId === questId;
    const endReason = isOwnSession ? session.endReason : null;
    const nextTurnAt = isOwnSession ? session.nextTurnAt : 0;

    // 待ち時間（ターン帯の表示中）か。再読み込み後は残り時間から再開する
    const cooldown = useCooldown(nextTurnAt, TURN_COOLDOWN_MS);

    // まだ1手も出していなければ、待ち時間の前半は「討伐開始」の帯を出す
    const isStarting =
        isOwnSession &&
        session.lastRound === null &&
        session.turnsLeft === session.maxTurns;
    const startPhase = useCooldown(
        isStarting ? nextTurnAt - TURN_COOLDOWN_MS : 0,
        HUNT_BANNER_MS
    );
    const resultPhase = useCooldown(
        isOwnSession && session.lastRound !== null
            ? nextTurnAt - TURN_COOLDOWN_MS + ROUND_RESULT_HOLD_MS
            : 0,
        ROUND_RESULT_HOLD_MS
    );

    // 「討伐成功」「討伐失敗」の帯は決着した瞬間だけ出す（再読み込みでは出さない）
    const [endBannerUntil, setEndBannerUntil] = useState(0);
    const endPhase = useCooldown(endBannerUntil, HUNT_BANNER_MS);

    // 討伐後は少し待ってからリザルトへ。画面を離れたらタイマーを取り消す
    useEffect(() => {
        if (screenStatus !== "ready" || endReason !== "victory" || session?.claimed) return;

        // 「討伐成功」の帯を見せきってから移る
        const timerId = setTimeout(() => {
            if (practice) advance("battle-finished");
            navigate(`/result/${questId}`, { replace: practice });
        }, HUNT_BANNER_MS);

        return () => clearTimeout(timerId);
    }, [screenStatus, endReason, session?.claimed, navigate, questId, practice, advance]);

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
    // 初手は討伐開始の後、それ以降は勝敗を見せてから次のターンの帯を出す。
    const showTurnBanner = isWaiting && !startPhase.isWaiting && !resultPhase.isWaiting;
    const turnBannerDuration = session.lastRound
        ? TURN_COOLDOWN_MS - ROUND_RESULT_HOLD_MS
        : TURN_COOLDOWN_MS;
    // 再読み込みで途中から表示する場合も、帯の動きを残り時間に合わせる
    const bannerElapsed = Math.max(0, turnBannerDuration - cooldown.remaining);
    const message = getBattleMessage(session);
    const roundResult = session.lastRound?.result;
    const roundLabel = roundResult ? ROUND_LABELS[roundResult] : null;

    // 下から上に出す討伐の帯（開始・成功・失敗）
    const huntBanner =
        !isBattleOver && startPhase.isWaiting
            ? {
                kind: "start",
                text: "討伐開始",
                elapsed: Math.max(0, HUNT_BANNER_MS - startPhase.remaining),
            }
            : isBattleOver && endPhase.isWaiting
                ? {
                    kind: endReason === "victory" ? "success" : "failure",
                    text: endReason === "victory" ? "討伐成功" : "討伐失敗",
                    elapsed: Math.max(0, HUNT_BANNER_MS - endPhase.remaining),
                }
                : null;

    const handleHandSelect = (playerHand: Hand) => {
        // 終了済み・待ち時間中なら null が返る（連打を防ぐガード）
        const round = playHand(playerHand);

        if (round?.session.endReason) {
            setEndBannerUntil(Date.now() + HUNT_BANNER_MS);
        }
    };

    return (
        <main className="battle-page">
            {/* 残り1手 or あと1回負けたら力尽きる状況で画面の縁に赤いモヤ */}
            {(turnsLeft === 1 || playerHp <= (session.monsterDamageMax ?? session.monsterAttack))
                && !isBattleOver && (
                <div
                    className="battle-danger-overlay"
                    aria-hidden="true"
                />
            )}

            {/* 討伐の開始・成功・失敗は画面中央に下から帯を出す */}
            {huntBanner && (
                <div
                    key={huntBanner.kind}
                    className={`battle-banner battle-hunt-banner battle-hunt-banner-${huntBanner.kind}`}
                    aria-hidden="true"
                    style={{
                        animationDuration: `${HUNT_BANNER_MS}ms`,
                        animationDelay: `-${huntBanner.elapsed}ms`,
                    }}
                >
                    <span>{huntBanner.text}</span>
                </div>
            )}

            {/* 帯は毎回作り直すため、読み上げは常設の領域で行う */}
            <div className="battle-sr-only" aria-live="polite">
                {huntBanner?.text
                    ?? (showTurnBanner ? `${turnNumber}ターン目` : "")}
            </div>

            {/* じゃんけんのルール：右上に固定した「？」からポップで開く */}
            <JankenRule maxTurns={session.maxTurns} />

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
                            src={getBattleMonsterImage(quest.image)}
                            alt="モンスター"
                            className="monster-image"
                        />
                        {/* 待機中のターン帯はモンスター画像内に表示し、勝敗に重ねない。 */}
                        {showTurnBanner && (
                            <div
                                key={turnNumber}
                                className="battle-banner battle-turn-banner"
                                aria-hidden="true"
                                style={{
                                    animationDuration: `${turnBannerDuration}ms`,
                                    animationDelay: `-${bannerElapsed}ms`,
                                }}
                            >
                                <span>{turnNumber}ターン目</span>
                            </div>
                        )}
                    </div>

                    <div className="monster-hp" data-tutorial="monster-hp">
                        <span>MONSTER HP</span>

                        <div className="hp-bar" role="meter" aria-label="モンスターの体力" aria-valuemin={0} aria-valuemax={session.monsterMaxHp} aria-valuenow={monsterHp}>
                            <div
                                className="hp-fill monster-hp-fill"
                                style={{
                                    transform: `scaleX(${Math.min(1, monsterHp / session.monsterMaxHp)})`,
                                }}
                            />
                        </div>

                        <div className="hp-number">
                            {monsterHp} / {session.monsterMaxHp}
                        </div>
                    </div>

                </section>


                {/* =========================
            MESSAGE
        ========================= */}

                <section className="battle-message" key={session.maxTurns - turnsLeft} role="status" aria-live="polite">
                    {roundResult && (
                        <strong className={`battle-round-result battle-round-result--${roundResult}`}>{roundLabel}</strong>
                    )}
                    <span>{message.text}</span>
                    {session.lastRound && (
                        <div className="battle-hands">
                            <figure className={`battle-hand${roundResult === "player" ? " is-winner" : ""}`}>
                                {/* 出した手も、手を選ぶボタンと同じ画像で表示する */}
                                <img src={battleAssets[session.lastRound.playerHand]} alt="" />
                                <figcaption>あなた：{HAND_LABELS[session.lastRound.playerHand]}</figcaption>
                            </figure>
                            <span className="battle-hands-vs" aria-hidden="true">VS</span>
                            <figure className={`battle-hand${roundResult === "enemy" ? " is-winner is-enemy-winner" : ""}`}>
                                <img src={battleAssets[session.lastRound.enemyHand]} alt="" />
                                <figcaption>モンスター：{HAND_LABELS[session.lastRound.enemyHand]}</figcaption>
                            </figure>
                        </div>
                    )}
                </section>

                {/* =========================
            PLAYER HP
        ========================= */}

                <section className="player-status">

                    <div className="player-name">
                        HUNTER
                    </div>

                    <div className="player-hp">
                        <div className="hp-bar" role="meter" aria-label="ハンターの体力" aria-valuemin={0} aria-valuemax={session.playerMaxHp} aria-valuenow={playerHp}>
                            <div
                                className="hp-fill player-hp-fill"
                                style={{
                                    transform: `scaleX(${Math.min(1, playerHp / session.playerMaxHp)})`,
                                }}
                            />
                        </div>

                        <span>
                            HP {playerHp} / {session.playerMaxHp}
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

                    <div className="janken-buttons" data-tutorial="battle-hands">

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
                            disabled={isBattleOver || isWaiting}
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
                            disabled={isBattleOver || isWaiting}
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
            RETRY
        ========================= */}

                {/* 「討伐失敗」の帯が消えてから出す */}
                {(endReason === "defeated" || endReason === "timeout")
                    && !endPhase.isWaiting && (
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

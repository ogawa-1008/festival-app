import { Fragment, useEffect, useRef, useState, type MouseEvent } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { useBattleSession } from "../../context/BattleSessionContext";
import { useGame } from "../../context/GameContext";
import { useGameTutorial } from "../../components/Tutorial/useGameTutorial";
import { battleAssets, getBattleMonsterImage } from "./battleAssets";
import { useSessionScreen } from "../../context/useSessionScreen";
import {
    type Hand,
    HUNT_BANNER_MS,
    TURN_COOLDOWN_MS,
} from "../../utils/battleSession";

import { HAND_LABELS, HAND_NAMES_TEXT } from "../../data/jankenRule";
import { HANDS } from "../../game/battle";
import { getBattleMessage, getShownRoundResult, ROUND_LABELS } from "./battleMessage";
import JankenRule from "./JankenRule";
import { useCooldown } from "./useCooldown";

import "./Battle.css";

// 勝敗を先に読めるようにしてから、残りの待機時間で次のターンの帯を出す
// （待ち時間より長くならないよう、待ち時間の半分を上限にする）
const ROUND_RESULT_HOLD_MS = Math.min(600, TURN_COOLDOWN_MS / 2);

// 画面に出す帯。表示を始めた時刻から、帯の動きのどこから再生するかを決める
// （再読み込みやタイマーの遅れで途中から出す場合も、残り時間と動きがずれないように）
function TimedBanner({ className, startAt, duration, text }: { className: string; startAt: number; duration: number; text: string }) {
    const [elapsed] = useState(() => Math.max(0, Date.now() - startAt));

    return (
        <div
            className={`battle-banner ${className}`}
            aria-hidden="true"
            style={{
                animationDuration: `${duration}ms`,
                animationDelay: `-${elapsed}ms`,
            }}
        >
            <span>{text}</span>
        </div>
    );
}

function Battle() {
    const navigate = useNavigate();
    const { questId } = useParams();

    const { quests } = useGame();
    const { session, playHand } = useBattleSession();
    const { active: practice, minimized: guideMinimized, advance } = useGameTutorial();
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
    // 決着後（nextTurnAt が 0）は次のターンがないので待たない
    const resultPhase = useCooldown(
        isOwnSession && session.lastRound !== null && nextTurnAt > 0
            ? nextTurnAt - TURN_COOLDOWN_MS + ROUND_RESULT_HOLD_MS
            : 0,
        ROUND_RESULT_HOLD_MS
    );

    // 押した手のボタンは待ち時間の間は押せなくなり、フォーカスが外れる。
    // キーボードや読み上げで操作している人が続けて選べるよう、押せるようになったら押したボタンに戻す
    const lastPressedHand = useRef<HTMLButtonElement | null>(null);
    useEffect(() => {
        const button = lastPressedHand.current;
        if (cooldown.isWaiting || endReason !== null || !button) return;
        if (document.activeElement === null || document.activeElement === document.body) {
            button.focus({ preventScroll: true });
        }
    }, [cooldown.isWaiting, endReason]);

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
    const message = getBattleMessage(session);
    // 手を使い切ったときは勝敗を大きく出さない（最後の手の結果は message.sub で小さく伝える）
    const roundResult = getShownRoundResult(session);
    const roundLabel = roundResult ? ROUND_LABELS[roundResult] : null;

    // 下から上に出す討伐の帯（開始・成功・失敗）
    const huntBanner =
        !isBattleOver && startPhase.isWaiting
            ? {
                kind: "start",
                text: "討伐開始",
                startAt: nextTurnAt - TURN_COOLDOWN_MS,
            }
            : isBattleOver && endPhase.isWaiting
                ? {
                    kind: endReason === "victory" ? "success" : "failure",
                    text: endReason === "victory" ? "討伐成功" : "討伐失敗",
                    startAt: endBannerUntil - HUNT_BANNER_MS,
                }
                : null;

    // どの手のボタンかは data-hand から読む（ボタンごとに関数を作らない）
    const handleHandClick = (event: MouseEvent<HTMLButtonElement>) => {
        lastPressedHand.current = event.currentTarget;
        // 終了済み・待ち時間中なら null が返る（連打を防ぐガード）
        const round = playHand(event.currentTarget.dataset.hand as Hand);

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
                <TimedBanner
                    key={huntBanner.kind}
                    className={`battle-hunt-banner battle-hunt-banner-${huntBanner.kind}`}
                    text={huntBanner.text}
                    startAt={huntBanner.startAt}
                    duration={HUNT_BANNER_MS}
                />
            )}

            {/* 画面には出さない読み上げ用の領域。討伐の帯と、手を選べるようになったことを伝える。
               「Nターン目」は手を出した直後に読むと勝敗の読み上げを途切れさせるため読まず、
               待ち時間が終わって手のボタンを押せるようになった時点で「手を選べます」と伝える
               （最初の1手は、メッセージ欄の「下のボタンから…選ぼう！」が読み上げられる） */}
            <div className="battle-sr-only" aria-live="polite">
                {huntBanner?.text
                    ?? (session.lastRound && !isBattleOver && !isWaiting ? "手を選べます" : "")}
            </div>

            {/* じゃんけんのルール：右上に固定した「？」からポップで開く */}
            {/* 討伐成功のあとは自動でリザルトへ移るので出さない（負け・手切れの再挑戦の前には見られるように残す） */}
            {/* 練習中でガイドを開いている間は、手のボタン以外を押せないので出さない（ルールはガイドの説明に書いてある）。
               ガイドを最小化したら、ルールを見られるように出す */}
            {endReason !== "victory" && (!practice || guideMinimized) && <JankenRule maxTurns={session.maxTurns} />}

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
                            <TimedBanner
                                key={turnNumber}
                                className="battle-turn-banner"
                                text={`${turnNumber}ターン目`}
                                startAt={nextTurnAt - turnBannerDuration}
                                duration={turnBannerDuration}
                            />
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

                <section className="battle-message" role="status" aria-live="polite">
                    {/* 読み上げの領域は残したまま、中身だけ毎ターン作り直す（同じ結果が続いても読み上げられるように） */}
                    <Fragment key={session.maxTurns - turnsLeft}>
                    {roundResult && (
                        <strong className={`battle-round-result battle-round-result--${roundResult}`}>{roundLabel}</strong>
                    )}
                    <span className="battle-message-text">{message.text}</span>
                    {message.sub && (
                        <span className="battle-message-sub">{message.sub}</span>
                    )}
                    {/* 直前の手がなく、手のボタンを押せるときだけ、手の選び方を案内する */}
                    {!session.lastRound && !isBattleOver && !isWaiting && (
                        <span>下のボタンから{HAND_NAMES_TEXT}を選ぼう！</span>
                    )}
                    {session.lastRound && (
                        <div className="battle-hands">
                            <figure className={`battle-hand${roundResult === "player" ? " is-winner" : ""}`}>
                                {/* 出した手も、手を選ぶボタンと同じ画像で表示する */}
                                <img src={battleAssets[session.lastRound.playerHand]} alt="" />
                                <figcaption><small>あなた</small><span className="battle-sr-only">：</span>{HAND_LABELS[session.lastRound.playerHand]}</figcaption>
                            </figure>
                            <span className="battle-hands-vs" aria-hidden="true">VS</span>
                            <figure className={`battle-hand${roundResult === "enemy" ? " is-winner is-enemy-winner" : ""}`}>
                                <img src={battleAssets[session.lastRound.enemyHand]} alt="" />
                                <figcaption><small>モンスター</small><span className="battle-sr-only">：</span>{HAND_LABELS[session.lastRound.enemyHand]}</figcaption>
                            </figure>
                        </div>
                    )}
                    </Fragment>
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

                    {/* 待ち時間の間は、手のボタンが押せない理由をボタンのそばに出す
                       （背の低い画面でスクロールしていると、モンスター画像の中の「Nターン目」が見えないため）。
                       読み上げは、押せるようになった時点の「手を選べます」で伝える */}
                    <div className="janken-title">
                        {isWaiting ? (
                            <span className="janken-title-wait" aria-hidden="true">
                                {isStarting ? "まもなく狩猟開始" : "次の手まで少し待ってね"}
                            </span>
                        ) : (
                            <span>CHOOSE YOUR HAND</span>
                        )}
                    </div>

                    <div className="janken-buttons" data-tutorial="battle-hands">

                        {HANDS.map((hand) => (
                            <button
                                key={hand}
                                type="button"
                                className={`janken-button janken-${hand}`}
                                data-hand={hand}
                                onClick={handleHandClick}
                                disabled={isBattleOver || isWaiting}
                            >
                                <div className="janken-image-frame">
                                    {/* 名前は下の文字で読み上げるので、画像は飾りとして扱う */}
                                    <img
                                        src={battleAssets[hand]}
                                        alt=""
                                        className="janken-image"
                                    />
                                </div>

                                <span>{HAND_LABELS[hand]}</span>
                            </button>
                        ))}

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

import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";

import { useBattleSession } from "../../context/BattleSessionContext";
import { useGame } from "../../context/GameContext";
import { useMapAreas } from "../../context/useMapAreas";
import { useGameTutorial } from "../../components/Tutorial/useGameTutorial";
import { useSessionScreen } from "../../context/useSessionScreen";
import { getBattleRankReward, getRankProgress } from "../../utils/hunterRank";
import { getRewardExp } from "../../utils/questReward";
import { getStampRallyProgress, getStampRallyState } from "../../utils/fieldProgress";
import { formatZenny, getRewardZenny } from "../../utils/weaponUpgrade";

import { useExpRewardAnimation } from "./useExpRewardAnimation";

import "./Result.css";

function Result() {
    const navigate = useNavigate();
    const { questId } = useParams();
    const location = useLocation();
    const { active: practice, advance } = useGameTutorial();

    // 別クエストのQRを読んで、このリザルトへ案内された場合の説明
    const notice =
        (location.state as { notice?: string } | null)?.notice ?? null;

    const { quests, rankExp, requiresUpdate, canUpdateGame, resolveBattle, obtainedFieldNoveltyIds } = useGame();
    const { session, claimReward } = useBattleSession();
    const screenStatus = useSessionScreen(questId);
    const mapAreas = useMapAreas();
    const [receipt, setReceipt] = useState<{ fromExp: number; gainedExp: number } | null>(null);
    // 3つ目のスタンプを受け取ったときだけ出す案内
    const [showStampModal, setShowStampModal] = useState(false);

    // モーダルは Esc キーでも閉じられるようにする
    useEffect(() => {
        if (!showStampModal) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setShowStampModal(false);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showStampModal]);
    const { frame, animateReward } = useExpRewardAnimation();
    const expPanel = useRef<HTMLDivElement>(null);

    const quest = quests.find(
        (item) => item.id === questId
    );


    if (!quest) {
        return (
            <main className="result-page">
                <div className="result-error">
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

    // 別タブで開いているリザルトはこのタブでは表示しない
    if (
        screenStatus === "elsewhere"
        || !session
        || session.questId !== quest.id
        || session.endReason === null
    ) {
        return <Navigate to="/" replace />;
    }

    const outcome = session.endReason === "victory"
        ? "victory"
        : "failure";
    const isTimeout = session.endReason === "timeout";
    const isGoldCrown = session.goldCrown;
    const rewardZenny = getRewardZenny(outcome);
    const claimed = session.claimed;
    const rewardExp = getBattleRankReward(
        rankExp,
        getRewardExp(quest.id, outcome)
    ).gainedExp;
    const displayedExp = receipt?.gainedExp ?? (claimed ? 0 : rewardExp);
    const progress = frame ?? getRankProgress(rankExp);
    const beforeRank = receipt ? getRankProgress(receipt.fromExp).rank : progress.rank;
    const rankedUp = claimed && !frame?.isAnimating && progress.rank > beforeRank;
    const expStatus = !claimed ? "報酬を受け取るとEXPが加算されます"
        : frame?.isAnimating ? "EXPを加算中…"
        : rankedUp ? `ランクアップ！ ハンターランク ${beforeRank} → ${progress.rank}`
        : progress.isMax ? "ハンターランクの上限に到達"
        : displayedExp > 0 ? `${displayedExp} EXPを獲得しました` : "受取済みの報酬です";

    const handleGoHome = () => {
        if (practice) advance("result-home");
        navigate("/", { replace: practice });
    };

    const handleClaimReward = () => {
        if (!canUpdateGame()) return;
        // 受け取り済みなら false（再読み込み・戻る操作での二重受け取りを防ぐ）
        if (!claimReward()) return;

        // この報酬で3つ目のスタンプになるかを、受け取る前の状態から確かめる
        const currentRally = getStampRallyProgress(mapAreas, quests, obtainedFieldNoveltyIds);
        const nextQuests = quests.map((item) =>
            item.id === quest.id
                ? {
                    ...item,
                    completed: item.completed || outcome === "victory",
                    investigated: item.investigated || outcome !== "victory",
                }
                : item,
        );
        const nextRally = getStampRallyProgress(mapAreas, nextQuests, obtainedFieldNoveltyIds);
        if (
            !practice
            && getStampRallyState(currentRally) === "collecting"
            && getStampRallyState(nextRally) === "redeemable"
        ) {
            setShowStampModal(true);
        }

        setReceipt({ fromExp: rankExp, gainedExp: rewardExp });
        animateReward(rankExp, rewardExp);

        resolveBattle(quest.id, outcome, isGoldCrown);
        if (practice) advance("reward-claimed");
        expPanel.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
    };

    return (
        <main className="result-page">
            <div className="result-content">

                {/* =========================
            ヘッダー
        ========================= */}

                <header className="result-header">
                    <h1>{outcome === "victory" ? "クエスト達成" : "調査結果"}</h1>
                </header>


                {/* =========================
            モンスターと討伐スタンプ
        ========================= */}

                <section className="result-monster-area">

                    <div className="result-section-label">
                        {outcome === "victory" ? "MISSION COMPLETE" : "MISSION FAILED"}
                    </div>

                    <div className="result-monster-stage">
                        
                        <div className="result-monster-frame">
                            <img
                                src={quest.image}
                                alt={quest.title}
                                className="result-monster-image"
                            />
                        </div>

                        {outcome === "victory" && (
                            <img
                                src="/images/quests/quest-clear.webp"
                                alt="QUEST CLEAR"
                                className="result-clear-stamp"
                            />
                        )}

                    </div>

                </section>


                {/* =========================
            クエスト情報
        ========================= */}

                <section className="result-quest">

                    <span className="result-quest-label">
                        QUEST
                    </span>

                    <h2>
                        {quest.title}
                    </h2>

                    {notice && !claimed && (
                        <p className="result-notice">
                            {notice}
                        </p>
                    )}

                    {isTimeout && (
                        <p className="result-timeout-message">
                            モンスターに逃げられてしまった……
                            <br />
                            もう一度挑戦してみよう！
                        </p>
                    )}

                </section>


                {/* =========================
            報酬
        ========================= */}

                <section className="result-reward">

                    <div className="result-section-title">
                        <span />
                        <h2>REWARD</h2>
                        <span />
                    </div>

                    <div className={`result-exp-panel${frame?.isAnimating ? " is-animating" : ""}${rankedUp ? " is-rank-up" : ""}`} ref={expPanel}>
                        <div className="result-exp-heading">
                            <strong>ハンターランク {progress.rank}</strong>
                            <span className="result-rank-exp">
                                {displayedExp > 0
                                    ? `+${claimed ? frame?.addedExp ?? displayedExp : displayedExp} EXP`
                                    : progress.isMax ? "ランク上限" : "+0 EXP（受取済み）"}
                            </span>
                        </div>
                        <div
                            className="result-exp-track"
                            role="progressbar"
                            aria-label="ハンターランク経験値"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={Math.round(progress.progressPercent * 100) / 100}
                            aria-valuetext={progress.isMax ? "ハンターランク100、上限に到達" : `ハンターランク${progress.rank}、${progress.progressExp} / ${progress.requiredExp} EXP`}
                        >
                            <div className="result-exp-fill" style={{ transform: `scaleX(${(frame?.isAnimating ? frame.goldProgressPercent : progress.progressPercent) / 100})` }} />
                            {frame?.isAnimating && (
                                <div
                                    className="result-exp-added"
                                    aria-hidden="true"
                                    style={{
                                        transform: `translateX(${frame.baseProgressPercent}%) scaleX(${Math.max(0, frame.progressPercent - frame.baseProgressPercent) / 100})`,
                                        opacity: frame.addedOpacity,
                                    }}
                                />
                            )}
                        </div>
                        <div className="result-exp-numbers">
                            {progress.isMax ? "MAX" : `${progress.progressExp} / ${progress.requiredExp} EXP`}
                        </div>
                        <p className="result-exp-status" role="status">{expStatus}</p>
                    </div>

                    <div className="result-reward-list">
                        <div className="result-reward-item">
                            <div className="result-reward-image result-reward-zenny" aria-hidden="true">
                                z
                            </div>

                            <div className="result-reward-name">
                                ゼニー
                            </div>

                            <div className="result-reward-amount">
                                {formatZenny(rewardZenny)}
                            </div>
                        </div>
                    </div>

                </section>


                {/* =========================
            報酬受取ボタン
        ========================= */}

                <button
                    type="button"
                    className="result-claim-button"
                    data-tutorial={claimed ? "result-home" : "claim-reward"}
                    onClick={claimed ? handleGoHome : handleClaimReward}
                    disabled={!claimed && requiresUpdate}
                >
                    {claimed
                        ? "ホームに戻る"
                        : outcome === "victory" ? "報酬を受け取る" : "落とし物を受け取る"}
                </button>

            </div>

            {showStampModal && (
                <div
                    className="result-stamp-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="result-stamp-modal-title"
                    onClick={(event) => {
                        if (event.target === event.currentTarget) setShowStampModal(false);
                    }}
                >
                    <div className="result-stamp-modal-card">
                        <img
                            className="result-stamp-modal-art"
                            src="/images/quests/quest-clear.webp"
                            alt=""
                            aria-hidden="true"
                        />
                        <span className="result-stamp-modal-eyebrow">STAMP RALLY</span>
                        <h2 id="result-stamp-modal-title">スタンプ3つ達成！</h2>
                        <p>
                            異なる3校舎のスタンプがそろいました。
                            <br />
                            ステッカー1枚と交換できます。
                        </p>
                        <button
                            type="button"
                            className="result-stamp-modal-primary"
                            onClick={() => navigate("/progress/stickers", { replace: practice })}
                        >
                            交換画面へ
                        </button>
                        <button
                            type="button"
                            className="result-stamp-modal-close"
                            onClick={() => setShowStampModal(false)}
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}

export default Result;

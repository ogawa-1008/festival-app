import { useRef, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";

import { useBattleSession } from "../../context/BattleSessionContext";
import { useGame } from "../../context/GameContext";
import { useSessionScreen } from "../../context/useSessionScreen";
import { progressData } from "../../data/progress";
import { getBattleRankReward, getRankProgress } from "../../utils/hunterRank";

import { useExpRewardAnimation } from "./useExpRewardAnimation";

import "./Result.css";

function Result() {
    const navigate = useNavigate();
    const { questId } = useParams();
    const location = useLocation();

    // 別クエストのQRを読んで、このリザルトへ案内された場合の説明
    const notice =
        (location.state as { notice?: string } | null)?.notice ?? null;

    const { quests, rankExp, resolveBattle } = useGame();
    const { session, claimReward } = useBattleSession();
    const screenStatus = useSessionScreen(questId);
    const [receipt, setReceipt] = useState<{ fromExp: number; gainedExp: number } | null>(null);
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
    const rewardRate = outcome === "victory" ? 1 : 0.5;
    const claimed = session.claimed;
    const rewardExp = getBattleRankReward(rankExp, outcome).gainedExp;
    const displayedExp = receipt?.gainedExp ?? (claimed ? 0 : rewardExp);
    const progress = frame ?? getRankProgress(rankExp);
    const beforeRank = receipt ? getRankProgress(receipt.fromExp).rank : progress.rank;
    const rankedUp = claimed && !frame?.isAnimating && progress.rank > beforeRank;
    const expStatus = !claimed ? "報酬を受け取るとEXPが加算されます"
        : frame?.isAnimating ? "EXPを加算中…"
        : rankedUp ? `RANK UP! HR ${beforeRank} → ${progress.rank}`
        : progress.isMax ? "ハンターランク上限に到達"
        : displayedExp > 0 ? `${displayedExp} EXPを獲得しました` : "受取済みの報酬です";

    const handleClaimReward = () => {
        // 受け取り済みなら false（再読み込み・戻る操作での二重受け取りを防ぐ）
        if (!claimReward()) return;

        setReceipt({ fromExp: rankExp, gainedExp: rewardExp });
        animateReward(rankExp, rewardExp);

        resolveBattle(quest.id, outcome, isGoldCrown);
        expPanel.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
    };

    return (
        <main className="result-page">
            <div className="result-content">

                {/* =========================
            HEADER
        ========================= */}

                <header className="result-header">
                    <span className="result-header-subtitle">
                        HUNTING BATTLE
                    </span>

                    <h1>{outcome === "victory" ? "クエスト達成" : "調査結果"}</h1>
                </header>


                {/* =========================
            MONSTER + STAMP
        ========================= */}

                <section className="result-monster-area">

                    <div className="result-section-label">
                        {outcome === "victory" ? "MONSTER DEFEATED" : "INVESTIGATION COMPLETE"}
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
                                src="/images/quests/stamp-image.png"
                                alt="QUEST CLEAR"
                                className="result-clear-stamp"
                            />
                        )}

                    </div>

                </section>


                {/* =========================
            QUEST
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
            REWARD
        ========================= */}

                <section className="result-reward">

                    <div className="result-section-title">
                        <span />
                        <h2>REWARD</h2>
                        <span />
                    </div>

                    <div className={`result-exp-panel${frame?.isAnimating ? " is-animating" : ""}${rankedUp ? " is-rank-up" : ""}`} ref={expPanel}>
                        <div className="result-exp-heading">
                            <strong>HR {progress.rank}</strong>
                            <span className="result-rank-exp">
                                {displayedExp > 0
                                    ? `+${claimed ? frame?.addedExp ?? displayedExp : displayedExp} EXP`
                                    : progress.isMax ? "HR MAX" : "+0 EXP（受取済み）"}
                            </span>
                        </div>
                        <div
                            className="result-exp-track"
                            role="progressbar"
                            aria-label="ハンターランク経験値"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={Math.round(progress.progressPercent * 100) / 100}
                            aria-valuetext={progress.isMax ? "HR100、上限に到達" : `HR${progress.rank}、${progress.progressExp} / ${progress.requiredExp} EXP`}
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

                        {quest.rewardMaterials.map((reward) => {

                            const material =
                                progressData.materials.find(
                                    (item) => item.id === reward.id
                                );

                            if (!material) {
                                return null;
                            }

                            return (
                                <div
                                    key={reward.id}
                                    className="result-reward-item"
                                >

                                    <div className="result-reward-image">
                                        <img
                                            src={material.image}
                                            alt={material.name}
                                        />
                                    </div>

                                    <div className="result-reward-name">
                                        {material.name}
                                    </div>

                                    <div className="result-reward-amount">
                                        × {Math.max(1, Math.ceil(reward.amount * rewardRate))}
                                    </div>

                                </div>
                            );
                        })}

                    </div>

                </section>


                {/* =========================
            CLAIM BUTTON
        ========================= */}

                <button
                    type="button"
                    className="result-claim-button"
                    onClick={handleClaimReward}
                    disabled={claimed}
                >
                    {claimed
                        ? "報酬を受け取りました"
                        : outcome === "victory" ? "報酬を受け取る" : "落とし物を受け取る"}
                </button>

                {claimed && (
                    <button
                        type="button"
                        className="result-claim-button"
                        onClick={() => navigate("/")}
                    >
                        ホームへ戻る
                    </button>
                )}

            </div>
        </main>
    );
}

export default Result;

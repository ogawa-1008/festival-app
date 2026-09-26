import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { useGame } from "../../context/GameContext";
import { progressData } from "../../data/progress";

import "./Result.css";

function Result() {
    const navigate = useNavigate();
    const { questId } = useParams();
    const [searchParams] = useSearchParams();

    const { quests, resolveBattle } = useGame();

    const [claimed, setClaimed] = useState(false);

    const quest = quests.find(
        (item) => item.id === questId
    );

    const outcome = searchParams.get("outcome") === "failure"
        ? "failure"
        : "victory";
    const isGoldCrown = searchParams.get("crown") === "1";
    const rewardRate = outcome === "victory" ? 1 : 0.5;

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

    const handleClaimReward = () => {
        if (claimed) return;

        setClaimed(true);

        resolveBattle(quest.id, outcome, isGoldCrown);
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

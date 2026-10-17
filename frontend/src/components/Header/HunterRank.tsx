import { getRankProgress } from "../../utils/hunterRank";
import "./HunterRank.css";

type HunterRankProps = {
  rankExp: number;
};

function HunterRank({ rankExp }: HunterRankProps) {
  const { rank, progressExp, requiredExp, progressPercent, isMax } = getRankProgress(rankExp);
  const expText = `${progressExp} / ${requiredExp} EXP`;

  return (
    <div className="hunter-rank">
      <div className="hunter-rank-summary">
        <div className="hunter-rank-label">HUNTER RANK</div>
        <div className="hunter-rank-number">{rank}</div>
      </div>
      <div className="hunter-rank-experience">
        <div className="hunter-rank-next">{isMax ? "上限に到達" : "次のHRまで"}</div>
        <div
          className="hunter-rank-progress"
          role="progressbar"
          aria-label="次のハンターランクまでの経験値"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
          aria-valuetext={isMax ? "HR100、上限に到達" : expText}
        >
          <div className="hunter-rank-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="hunter-rank-exp">{isMax ? "MAX" : expText}</div>
      </div>
    </div>
  );
}

export default HunterRank;

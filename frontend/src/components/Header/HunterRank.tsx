import "./HunterRank.css";

type HunterRankProps = {
    rank: number;
};

function HunterRank({ rank }: HunterRankProps) {
    return (
        <div className="hunter-rank">
            <div className="hunter-rank-label">
                HUNTER RANK
            </div>

            <div className="hunter-rank-number">
                {rank}
            </div>
        </div>
    );
}

export default HunterRank;

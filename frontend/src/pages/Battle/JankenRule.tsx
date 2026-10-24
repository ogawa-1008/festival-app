import { useRef, useState } from "react";

import type { Hand } from "../../utils/battleSession";
import { battleAssets } from "./battleAssets";

import "./JankenRule.css";

// 図の並び（上：グー、左下：チョキ、右下：パー）。矢印は「勝つ相手」を指す
const RULE_HANDS: { hand: Hand; label: string; english: string }[] = [
    { hand: "rock", label: "グー", english: "ROCK" },
    { hand: "scissors", label: "チョキ", english: "SCISSORS" },
    { hand: "paper", label: "パー", english: "PAPER" },
];

type JankenRuleProps = {
    // この狩猟で出せる手の数（説明文に使う）
    maxTurns: number;
};

// 狩猟画面の右上に固定した「？」から開く、じゃんけんのルール
function JankenRule({ maxTurns }: JankenRuleProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                className="janken-rule-button"
                aria-label="じゃんけんのルールを見る"
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                aria-controls="janken-rule-dialog"
                onClick={() => {
                    dialogRef.current?.showModal();
                    setIsOpen(true);
                }}
            >
                ?
            </button>

            <dialog
                ref={dialogRef}
                id="janken-rule-dialog"
                className="janken-rule-dialog"
                aria-labelledby="janken-rule-title"
                closedby="any"
                onClose={() => setIsOpen(false)}
                onClick={(event) => {
                    // 背景クリックによる終了に未対応のブラウザでも、枠の外なら閉じる。
                    if ("closedBy" in HTMLDialogElement.prototype || event.target !== event.currentTarget) return;
                    const rect = event.currentTarget.getBoundingClientRect();
                    if (event.clientX < rect.left || event.clientX > rect.right
                        || event.clientY < rect.top || event.clientY > rect.bottom) {
                        event.currentTarget.close();
                    }
                }}
            >
                <section className="janken-rule">
                    <header className="janken-rule-title">
                        <span>JANKEN RULE</span>
                        <h2 id="janken-rule-title">じゃんけんのルール</h2>
                    </header>

                    {/* 手のボタンと同じ画像で、どの手がどの手に勝つかを示す */}
                    <div className="janken-rule-chart" aria-hidden="true">
                        {RULE_HANDS.map(({ hand, label, english }) => (
                            <div key={hand} className={`janken-rule-hand janken-rule-${hand}`}>
                                <img src={battleAssets[hand]} alt="" />
                                <strong>{label}</strong>
                                <span>{english}</span>
                            </div>
                        ))}

                        <span className="janken-rule-arrow janken-rule-arrow-rock" />
                        <span className="janken-rule-arrow janken-rule-arrow-scissors" />
                        <span className="janken-rule-arrow janken-rule-arrow-paper" />
                    </div>

                    <p className="janken-rule-lead">
                        矢印の先の手に勝ちます。
                        <br />
                        グーはチョキに、チョキはパーに、パーはグーに勝ちます。
                    </p>

                    <dl className="janken-rule-results">
                        <div>
                            <dt className="janken-rule-result-win">勝ち</dt>
                            <dd>モンスターにダメージを与える</dd>
                        </div>
                        <div>
                            <dt className="janken-rule-result-lose">負け</dt>
                            <dd>あなたがダメージを受ける</dd>
                        </div>
                        <div>
                            <dt className="janken-rule-result-draw">あいこ</dt>
                            <dd>どちらのHPも変わらない（1手に数える）</dd>
                        </div>
                    </dl>

                    <p className="janken-rule-goal">
                        {maxTurns}手以内にモンスターのHPを0にすると討伐成功です。
                        <br />
                        あなたのHPが0になるか、手が残っていないと
                        <br />
                        討伐失敗ですが、「調査」として報酬の一部を受け取れます。
                    </p>

                    <button
                        type="button"
                        className="janken-rule-close"
                        onClick={() => dialogRef.current?.close()}
                    >
                        閉じる
                    </button>
                </section>
            </dialog>
        </>
    );
}

export default JankenRule;

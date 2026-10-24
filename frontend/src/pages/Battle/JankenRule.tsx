import { useRef } from "react";

import { battleAssets } from "./battleAssets";
import { HAND_LABELS, JANKEN_RULE_TEXT } from "../../data/jankenRule";
import { HANDS } from "../../game/battle";

import "./JankenRule.css";

// 図の並びは HANDS の順（上：グー、左下：チョキ、右下：パー）。矢印は「勝つ相手」を指す

// 背景を押して閉じる仕組み（closedby）にブラウザが対応しているか
const supportsClosedBy = typeof HTMLDialogElement !== "undefined" && "closedBy" in HTMLDialogElement.prototype;

type JankenRuleProps = {
    // この狩猟で出せる手の数（説明文に使う）
    maxTurns: number;
};

// 狩猟画面の右上に固定した「？」から開く、じゃんけんのルール
function JankenRule({ maxTurns }: JankenRuleProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    // 背景を押して閉じる処理用：押し始めた場所が背景だったか
    const pressedBackdrop = useRef(false);

    // 枠の外（背景）の座標か
    const isOutside = (dialog: HTMLDialogElement, x: number, y: number) => {
        const rect = dialog.getBoundingClientRect();
        return x < rect.left || x > rect.right || y < rect.top || y > rect.bottom;
    };

    return (
        <>
            <button
                type="button"
                className="janken-rule-button"
                aria-label="じゃんけんのルールを見る"
                aria-haspopup="dialog"
                aria-controls="janken-rule-dialog"
                onClick={() => {
                    const dialog = dialogRef.current;
                    if (!dialog) return;
                    dialog.showModal();
                    // 一番下の「閉じる」ではなく見出しに移り、上から読めるようにする
                    titleRef.current?.focus();
                    dialog.scrollTop = 0;
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
                // 背景を押して閉じる仕組みに未対応のブラウザ向け。押し始めも離したところも背景のときだけ閉じる
                // （ポップの中から外へ指を動かして離したときは閉じない）
                onPointerDown={supportsClosedBy ? undefined : (event) => {
                    pressedBackdrop.current = event.target === event.currentTarget
                        && isOutside(event.currentTarget, event.clientX, event.clientY);
                }}
                onClick={supportsClosedBy ? undefined : (event) => {
                    if (pressedBackdrop.current && event.target === event.currentTarget) {
                        event.currentTarget.close();
                    }
                    pressedBackdrop.current = false;
                }}
            >
                <section className="janken-rule">
                    <header className="janken-rule-title">
                        <span>JANKEN RULE</span>
                        <h2 id="janken-rule-title" ref={titleRef} tabIndex={-1}>じゃんけんのルール</h2>
                    </header>

                    {/* 手のボタンと同じ画像で、どの手がどの手に勝つかを示す */}
                    <div className="janken-rule-chart" aria-hidden="true">
                        {HANDS.map((hand) => (
                            <div key={hand} className={`janken-rule-hand janken-rule-${hand}`}>
                                <img src={battleAssets[hand]} alt="" />
                                <strong>{HAND_LABELS[hand]}</strong>
                                <span>{hand.toUpperCase()}</span>
                            </div>
                        ))}

                        <span className="janken-rule-arrow janken-rule-arrow-rock" />
                        <span className="janken-rule-arrow janken-rule-arrow-scissors" />
                        <span className="janken-rule-arrow janken-rule-arrow-paper" />
                    </div>

                    <p className="janken-rule-lead">
                        矢印の先の手に勝ちます。
                        <br />
                        {JANKEN_RULE_TEXT}
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
                        {`${maxTurns}手以内にモンスターのHPを0にすると討伐成功です。`
                            + "あなたのHPが0になるか、手が残っていないと討伐失敗ですが、"
                            + "「調査」として報酬の一部を受け取れます。"}
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

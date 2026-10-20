import test from 'node:test';
import assert from 'node:assert/strict';
import { battleBalances, chooseEnemyHand, createBattle, getBattleBalance, hunterMaxHp, practiceEnemyHand, resolveTurn } from '../src/game/battle.ts';

const midpoint = () => .5;

test('hands apply damage to the correct side, clamp lethal hits, and stop after the hunt ends', () => {
  const balance = getBattleBalance('quest-001');
  for (const [player, enemy, outcome] of [
    ['rock','scissors','player'], ['scissors','paper','player'], ['paper','rock','player'],
    ['scissors','rock','enemy'], ['paper','scissors','enemy'], ['rock','paper','enemy'],
    ['rock','rock','draw'], ['scissors','scissors','draw'], ['paper','paper','draw'],
  ]) {
    const start = createBattle(balance);
    const next = resolveTurn(start, balance, player, enemy, midpoint);
    assert.equal(next.outcome, outcome);
    assert.equal(next.playerHp, outcome === 'enemy' ? 88 : hunterMaxHp);
    assert.equal(next.monsterHp, outcome === 'player' ? 88 : balance.monsterMaxHp);
    assert.equal(start.round, 0, 'previous snapshots must remain unchanged');
  }
  assert.equal(resolveTurn(createBattle(balance),balance,'rock','scissors',()=>0).damage,28);
  assert.equal(resolveTurn(createBattle(balance),balance,'rock','scissors',()=>1-Number.EPSILON).damage,36);
  for(const [player,enemy,terminal] of [['rock','scissors','victory'],['rock','paper','failure']]) {
    let state=createBattle(balance);
    for(let i=0;i<20 && state.status==='playing';i++) state=resolveTurn(state,balance,player,enemy,midpoint);
    assert.equal(state.status,terminal);
    assert.ok(state.monsterHp>=0 && state.playerHp>=0);
    assert.equal(terminal==='victory'?state.monsterHp:state.playerHp,0);
    assert.deepEqual(resolveTurn(state,balance,'rock','scissors',midpoint),state);
  }
});

test('practice uses real damage and reaches victory after teaching a draw and a loss', () => {
  const balance=getBattleBalance('quest-001');
  let state=createBattle(balance);
  const outcomes=[];
  const hands=['rock','paper','scissors'];
  while(state.status==='playing' && state.round<20){
    const player=hands[state.round%hands.length];
    state=resolveTurn(state,balance,player,practiceEnemyHand(player,state.round),midpoint);
    outcomes.push(state.outcome);
  }
  assert.deepEqual(outcomes,['draw','enemy','player','player','player','player']);
  assert.equal(state.status,'victory');
  assert.equal(state.playerHp,88);
  assert.equal(state.monsterHp,0);
});

test('festival hunts remain short and progressively harder under uniform random play', () => {
  let seed=20261020;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  let previousWinRate=1;
  let previousTurns=0;
  const limits={ 'quest-001':[.85,.97], 'quest-002':[.72,.85], 'quest-003':[.60,.75] };
  for(const [id,balance] of Object.entries(battleBalances)){
    let wins=0;
    const turns=[];
    for(let i=0;i<10000;i++){
      let state=createBattle(balance);
      while(state.status==='playing' && state.round<200){
        state=resolveTurn(state,balance,'rock',chooseEnemyHand(random),random);
        assert.ok(state.playerHp>=0 && state.playerHp<=hunterMaxHp);
        assert.ok(state.monsterHp>=0 && state.monsterHp<=balance.monsterMaxHp);
      }
      assert.notEqual(state.status,'playing','a hunt must terminate');
      wins+=state.status==='victory';
      turns.push(state.round);
    }
    turns.sort((a,b)=>a-b);
    const winRate=wins/turns.length;
    const meanTurns=turns.reduce((a,b)=>a+b)/turns.length;
    assert.ok(winRate>=limits[id][0] && winRate<=limits[id][1],`${id}: win rate ${winRate}`);
    assert.ok(winRate<previousWinRate && meanTurns>previousTurns,'difficulty should increase in quest order');
    assert.ok(meanTurns<=18 && turns[Math.floor(turns.length*.95)]<=26,`${id}: hunts are taking too long`);
    previousWinRate=winRate; previousTurns=meanTurns;
    console.log(`${id}: win ${(winRate*100).toFixed(1)}%, mean ${meanTurns.toFixed(1)} hands, p95 ${turns[Math.floor(turns.length*.95)]} hands`);
  }
});

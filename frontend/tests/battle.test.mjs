import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattle, getBattleBalance, hunterMaxHp, resolveTurn } from '../src/game/battle.ts';

import { quests } from '../src/data/quests.ts';
import { getBattleStats } from '../src/utils/battleStats.ts';
import { createSession, playRound } from '../src/utils/battleSession.ts';
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

test('configured festival hunts remain short and winnable under uniform random play', () => {
  let seed=20261020;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  // 同じ強さの校舎はまとめて検証し、各モンスターで同じシミュレーションを繰り返さない。
  const configurations = new Map(quests.map((quest) => [JSON.stringify(getBattleStats(quest, { weaponClaimed: false })), quest]));
  for(const quest of configurations.values()){
    const id=quest.id;
    const stats=getBattleStats(quest,{weaponClaimed:false});
    let wins=0;
    const turns=[];
    for(let i=0;i<10000;i++){
      let state=createSession(id,stats,'simulation');
      while(state.endReason===null && state.turnsLeft>0){
        state=playRound(state,'rock',random,state.nextTurnAt).session;
        assert.ok(state.playerHp>=0 && state.playerHp<=stats.playerMaxHp);
        assert.ok(state.monsterHp>=0 && state.monsterHp<=stats.monsterMaxHp);
      }
      assert.notEqual(state.endReason,null,'a hunt must terminate');
      wins+=state.endReason==='victory';
      turns.push(state.maxTurns-state.turnsLeft);
    }
    turns.sort((a,b)=>a-b);
    const winRate=wins/turns.length;
    const meanTurns=turns.reduce((a,b)=>a+b)/turns.length;
    assert.ok(winRate>=.60 && winRate<=.97,`${id}: win rate ${winRate}`);
    assert.ok(meanTurns<=18 && turns[Math.floor(turns.length*.95)]<=26,`${id}: hunts are taking too long`);
    console.log(`${id}: win ${(winRate*100).toFixed(1)}%, mean ${meanTurns.toFixed(1)} hands, p95 ${turns[Math.floor(turns.length*.95)]} hands`);
  }
});

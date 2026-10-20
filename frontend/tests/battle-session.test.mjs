import test from 'node:test';
import assert from 'node:assert/strict';
import { quests } from '../src/data/quests.ts';
import { getBattleStats } from '../src/utils/battleStats.ts';
import { createSession, parseSession, playRound, TURN_COOLDOWN_MS } from '../src/utils/battleSession.ts';

const fresh = () => ({ ...createSession(quests[0].id,getBattleStats(quests[0],{weaponClaimed:false}),'owner'), nextTurnAt: Date.now()-1 });

test('a persisted hunt retains its HP, owner, cooldown, damage ranges and one-time result', () => {
  const initial=fresh();
  const now=Date.now();
  const hit=playRound(initial,'rock',()=>.4,now).session;
  assert.equal(hit.monsterHp,89);
  assert.equal(hit.turnsLeft,29);
  assert.equal(hit.nextTurnAt,now+TURN_COOLDOWN_MS);
  const restored=parseSession(JSON.parse(JSON.stringify(hit)));
  assert.equal(restored.ownerTabId,'owner');
  assert.equal(restored.monsterHp,89);
  assert.equal(restored.nextTurnAt,hit.nextTurnAt);
  assert.equal(restored.lastRound.damage,31);
  assert.equal(restored.playerDamageMin,28);
  assert.equal(restored.playerDamageMax,36);
  assert.deepEqual(playRound(restored,'rock',()=>.4,now).session,restored,'reload must not bypass cooldown');
  let state=restored;
  while(state.endReason===null) state=playRound(state,'rock',()=>.4,state.nextTurnAt).session;
  assert.equal(state.endReason,'victory');
  assert.equal(state.monsterHp,0);
  assert.deepEqual(playRound(state,'paper',()=>0,state.nextTurnAt+10000).session,state,'the crown and result must not be rerolled after victory');
});

test('legacy hunts retain fixed attacks while new hunts snapshot quest and weapon configuration', () => {
  const old={...fresh(),playerHp:2,playerMaxHp:3,playerAttack:1,monsterHp:2,monsterMaxHp:3,monsterAttack:1,maxTurns:9,turnsLeft:8};
  delete old.playerDamageMin; delete old.playerDamageMax; delete old.monsterDamageMin; delete old.monsterDamageMax;
  const restored=parseSession(JSON.parse(JSON.stringify(old)));
  const hit=playRound(restored,'rock',()=>.4,Date.now()).session;
  assert.equal(hit.monsterHp,1);
  assert.equal(hit.playerHp,2);
  assert.equal(hit.monsterMaxHp,3);
  assert.equal(hit.maxTurns,9);
  assert.equal(hit.playerDamageMin,1);
  for(const quest of quests){
    const base=getBattleStats(quest,{weaponClaimed:false});
    const armed=getBattleStats(quest,{weaponClaimed:true});
    assert.equal(base.monsterMaxHp,quest.monsterHp);
    assert.equal(base.maxTurns,30);
    assert.equal(base.playerMaxHp,100);
    assert.equal(armed.playerDamageMin-base.playerDamageMin,1);
    assert.equal(armed.playerDamageMax-base.playerDamageMax,1);
  }
});

test('the final permitted hand prioritizes victory and defeat over timeout, and practice completes through the same session rules', () => {
  const last={...fresh(),turnsLeft:1,monsterHp:20};
  assert.equal(playRound(last,'rock',()=>.4,Date.now()).session.endReason,'victory');
  assert.equal(playRound({...last,playerHp:10},'rock',()=>.9,Date.now()).session.endReason,'defeated');
  assert.equal(playRound(last,'rock',()=>0,Date.now()).session.endReason,'timeout');
  let state=fresh();
  const outcomes=[];
  while(state.endReason===null){
    const next=playRound(state,'rock',Math.random,state.nextTurnAt,true);
    state=next.session; outcomes.push(next.result);
  }
  assert.deepEqual(outcomes,['draw','enemy','player','player','player','player']);
  assert.equal(state.playerHp,88);
  assert.equal(state.endReason,'victory');
  assert.equal(state.goldCrown,false);
});

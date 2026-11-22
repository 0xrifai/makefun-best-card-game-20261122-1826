// rules.js — the duel itself: state, turns, resonance combos, damage and
// shields. It knows nothing about the DOM; render.js draws what it returns.

import { buildDeck, drawFrom, cardById } from './deck.js';

export const START_LIFE = 30;
export const MAX_TIDE = 8;
export const HAND_LIMIT = 7;

export function createSide(seed) {
  return {
    life: START_LIFE,
    shield: 0,
    tide: 0,
    maxTide: 0,
    deck: buildDeck(seed),
    hand: [],
    discard: [],
    playedSuits: [],
  };
}

export function createGame(seed = 20261122) {
  const game = {
    seed,
    turn: 1,
    phase: 'title', // title | play | win | loss
    player: createSide(seed),
    enemy: createSide(seed + 77),
    log: [],
    lastPlayed: null, // { card, by: 'player' | 'enemy', resonance: bool }
    resonance: false,
    winner: null,
  };
  drawFrom(game.player.deck, game.player.hand, 5);
  drawFrom(game.enemy.deck, game.enemy.hand, 5);
  return game;
}

export function startDuel(game) {
  game.phase = 'play';
  game.turn = 1;
  beginPlayerTurn(game);
  pushLog(game, 'The duel begins. Your tide rises — play a card, then end your turn.');
}

export function beginPlayerTurn(game) {
  const p = game.player;
  p.maxTide = Math.min(game.turn, MAX_TIDE);
  p.tide = p.maxTide;
  p.playedSuits = [];
  drawFrom(p.deck, p.hand, 1);
  if (p.hand.length > HAND_LIMIT) {
    const lost = p.hand.splice(HAND_LIMIT);
    p.discard.push(...lost);
    pushLog(game, `Hand full — ${lost.length} card${lost.length > 1 ? 's' : ''} discarded.`);
  }
}

export function beginEnemyTurn(game) {
  const e = game.enemy;
  e.maxTide = Math.min(game.turn, MAX_TIDE);
  e.tide = e.maxTide;
  e.playedSuits = [];
  drawFrom(e.deck, e.hand, 1);
}

// Resonance: playing two cards of the same suit in one turn makes the
// second one hit harder — +2 damage, or +2 shield on a guard card.
export function resonanceBonus(side, card) {
  if (!side.playedSuits.includes(card.suit)) return 0;
  return 2;
}

export function canPlay(game, side, card) {
  if (game.phase !== 'play') return false;
  return side.tide >= card.cost;
}

// Apply one card. Returns a report the renderer animates from.
export function playCard(game, side, other, card) {
  if (!canPlay(game, side, card)) return null;
  const bonus = resonanceBonus(side, card);
  const resonance = bonus > 0;
  side.tide -= card.cost;
  side.hand.splice(side.hand.indexOf(card), 1);
  side.discard.push(card);
  side.playedSuits.push(card.suit);

  const report = { card, resonance, bonus, damage: 0, shield: 0, healed: 0, drew: 0, tideGain: 0, selfHarm: 0 };
  const who = side === game.player ? 'You' : 'The Warden';

  if (card.kind === 'strike') {
    let dmg = card.amount + bonus;
    if (card.id === 'wildfire' && side.playedSuits.includes('wave')) dmg += 3;
    report.damage = dmg;
    dealDamage(game, other, dmg);
  } else if (card.kind === 'guard') {
    report.shield = card.amount + bonus;
    side.shield += report.shield;
  } else if (card.kind === 'mend') {
    report.healed = Math.min(card.amount, START_LIFE - side.life);
    side.life += report.healed;
  } else if (card.kind === 'draw') {
    report.drew = drawFrom(side.deck, side.hand, card.amount).length;
  } else if (card.kind === 'surge') {
    report.tideGain = card.amount;
    side.tide += card.amount;
    report.drew = drawFrom(side.deck, side.hand, 1).length;
  }
  if (card.id === 'kelp-snare') {
    report.shield = 4;
    side.shield += 4;
  }
  if (card.id === 'thornvine') {
    report.healed = Math.min(3, START_LIFE - side.life);
    side.life += report.healed;
  }
  if (card.id === 'undertow' || card.id === 'spore-burst') {
    report.drew = drawFrom(side.deck, side.hand, 1).length;
  }
  if (card.id === 'reefquake') {
    report.selfHarm = 2;
    side.life -= 2;
  }

  game.lastPlayed = { card, by: side === game.player ? 'player' : 'enemy', resonance };
  pushLog(game, describePlay(who, report));
  checkEnd(game);
  return report;
}

export function dealDamage(game, target, amount) {
  const blocked = Math.min(target.shield, amount);
  target.shield -= blocked;
  target.life -= (amount - blocked);
  if (target.life < 0) target.life = 0;
}

export function checkEnd(game) {
  if (game.enemy.life <= 0 && game.player.life <= 0) {
    game.phase = game.player.life >= game.enemy.life ? 'win' : 'loss';
  } else if (game.enemy.life <= 0) {
    game.phase = 'win';
  } else if (game.player.life <= 0) {
    game.phase = 'loss';
  }
  if (game.phase === 'win' || game.phase === 'loss') game.winner = game.phase;
}

export function describePlay(who, report) {
  const parts = [`${who} played ${report.card.name}`];
  if (report.resonance) parts.push(`— RESONANCE +${report.bonus}!`);
  if (report.damage) parts.push(`dealt ${report.damage} damage`);
  if (report.shield) parts.push(`gained ${report.shield} shield`);
  if (report.healed) parts.push(`restored ${report.healed} life`);
  if (report.drew) parts.push(`drew ${report.drew} card${report.drew > 1 ? 's' : ''}`);
  if (report.tideGain) parts.push(`gained ${report.tideGain} tide`);
  if (report.selfHarm) parts.push(`took ${report.selfHarm} recoil damage`);
  return parts.join(' ');
}

export function pushLog(game, line) {
  game.log.unshift(line);
  if (game.log.length > 6) game.log.length = 6;
}

export function lifePercent(side) {
  return Math.max(0, Math.round((side.life / START_LIFE) * 100));
}

export { cardById };

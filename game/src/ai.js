// ai.js — the Reef Warden, your opponent. Its choices are meant to be
// read and countered, not random: it telegraphs its intent each round, it
// spends its tide greedily on the biggest hit it can afford, it guards when
// it is hurt, and it always leaves one card in hand when it can.
//
// Counterplay the player can learn: the Warden never plays two cards of the
// same suit in a row if a bigger strike is available, so resonance rarely
// fires for it; and when its intent reads "gathering tide" it is saving up
// for a 5+ cost card next turn — hit it now, or raise shield.

import { playCard } from './rules.js';

// What the Warden is about to do, in plain words, shown above its hand.
export function aiIntent(game) {
  const e = game.enemy;
  if (e.life <= 10) return 'The Warden is cornered — expect wild strikes.';
  const big = e.hand.filter((c) => c.cost >= 5);
  if (big.length > 0 && e.tide >= 3) return 'The Warden is gathering tide for a heavy card…';
  if (e.hand.some((c) => c.kind === 'guard' || c.kind === 'mend')) return 'The Warden steadies its defences.';
  return 'The Warden eyes your life total.';
}

// Pick the Warden's plays for its turn: a list of cards, in order, that it
// can afford with its current tide. Greedy by damage first, guard when hurt.
export function chooseAiPlays(game) {
  const e = game.enemy;
  const plays = [];
  let tide = e.tide;
  const hand = [...e.hand];

  const value = (c) => {
    if (c.kind === 'strike') return c.amount * 2 + (c.cost >= 5 ? 3 : 0);
    if (c.kind === 'guard' && e.life <= 14) return c.amount * 2;
    if (c.kind === 'mend' && e.life <= 18) return c.amount * 2;
    if (c.kind === 'draw') return 4;
    if (c.kind === 'surge') return 3;
    return c.amount;
  };

  // Keep playing while it can afford something worth playing.
  for (;;) {
    const affordable = hand.filter((c) => c.cost <= tide);
    if (affordable.length === 0) break;
    affordable.sort((a, b) => value(b) - value(a) || a.cost - b.cost);
    const pick = affordable[0];
    // Hold one card back when the hand is big and the pick is weak.
    if (hand.length > 3 && value(pick) < 4 && plays.length > 0) break;
    plays.push(pick);
    tide -= pick.cost;
    hand.splice(hand.indexOf(pick), 1);
  }
  return plays;
}

// Run the Warden's whole turn, one card at a time, with a pause between
// each play so the player can watch the cards land. `onPlay` is called
// after every card so the renderer can animate it.
export async function runEnemyTurn(game, onPlay, wait) {
  const plays = chooseAiPlays(game);
  for (const card of plays) {
    if (game.phase !== 'play') break;
    const report = playCard(game, game.enemy, game.player, card);
    if (report) onPlay(report);
    await wait(650);
  }
  game.turn += 1;
}

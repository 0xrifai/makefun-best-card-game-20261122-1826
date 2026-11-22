// deck.js — every card in Tidebreak Duel, plus the deck builder and the
// seeded shuffle. One job only: know what cards exist and hand out decks.
//
// The four suits are told apart by colour AND by shape, never by text alone:
//   wave  — blue,    droplet
//   ember — orange,  flame
//   kelp  — green,   leaf
//   coral — violet,  shell
// Each suit has its own personality: wave hits hard, ember is cheap and
// fast, kelp heals and shields, coral draws and guards.

export const SUITS = {
  wave:  { name: 'Wave',  color: '#2fa8e0', dark: '#0b5e86', glyph: 'drop' },
  ember: { name: 'Ember', color: '#f2692e', dark: '#8f2f08', glyph: 'flame' },
  kelp:  { name: 'Kelp',  color: '#3cb371', dark: '#14532d', glyph: 'leaf' },
  coral: { name: 'Coral', color: '#a06cd5', dark: '#4c2a7a', glyph: 'shell' },
};

// id, name, suit, cost in tide, kind, amount, extra
// kinds: strike (damage), guard (shield), mend (heal), draw, surge (tide now)
export const CARD_DEFS = [
  { id: 'ember-dart',   name: 'Ember Dart',   suit: 'ember', cost: 1, kind: 'strike', amount: 2, text: 'Deal 2 damage.' },
  { id: 'coral-guard',  name: 'Coral Guard',  suit: 'coral', cost: 1, kind: 'guard',  amount: 4, text: 'Gain 4 shield.' },
  { id: 'kindle',       name: 'Kindle',       suit: 'ember', cost: 1, kind: 'surge',  amount: 1, text: 'Gain 1 tide. Draw a card.' },
  { id: 'riptide',      name: 'Riptide Slash', suit: 'wave', cost: 2, kind: 'strike', amount: 4, text: 'Deal 4 damage.' },
  { id: 'tidewall',     name: 'Tidewall',     suit: 'wave',  cost: 2, kind: 'guard',  amount: 6, text: 'Gain 6 shield.' },
  { id: 'kelp-snare',   name: 'Kelp Snare',   suit: 'kelp',  cost: 2, kind: 'strike', amount: 2, text: 'Deal 2 damage. Gain 4 shield.' },
  { id: 'bloom',        name: 'Bloom',        suit: 'kelp',  cost: 2, kind: 'mend',   amount: 5, text: 'Restore 5 life.' },
  { id: 'tidecaller',   name: 'Tidecaller',   suit: 'coral', cost: 2, kind: 'draw',   amount: 2, text: 'Draw 2 cards.' },
  { id: 'undertow',     name: 'Undertow',     suit: 'wave',  cost: 3, kind: 'strike', amount: 3, text: 'Deal 3 damage. Draw a card.' },
  { id: 'spore-burst',  name: 'Spore Burst',  suit: 'kelp',  cost: 3, kind: 'strike', amount: 3, text: 'Deal 3 damage. Draw a card.' },
  { id: 'pearl-shot',   name: 'Pearl Shot',   suit: 'coral', cost: 3, kind: 'strike', amount: 5, text: 'Deal 5 damage.' },
  { id: 'wildfire',     name: 'Wildfire',     suit: 'ember', cost: 4, kind: 'strike', amount: 6, text: 'Deal 6 damage. +3 if a Wave card was played this turn.' },
  { id: 'thornvine',    name: 'Thornvine',    suit: 'kelp',  cost: 4, kind: 'strike', amount: 5, text: 'Deal 5 damage. Restore 3 life.' },
  { id: 'crashing-wave', name: 'Crashing Wave', suit: 'wave', cost: 5, kind: 'strike', amount: 8, text: 'Deal 8 damage.' },
  { id: 'magma-bloom',  name: 'Magma Bloom',  suit: 'ember', cost: 6, kind: 'strike', amount: 10, text: 'Deal 10 damage.' },
  { id: 'reefquake',    name: 'Reefquake',    suit: 'coral', cost: 7, kind: 'strike', amount: 12, text: 'Deal 12 damage. Lose 2 life.' },
];

// How many copies of each card a 30-card deck holds. The deck is the same
// for both duelists, so every match-up is a fair mirror.
const DECK_LIST = [
  ['ember-dart', 3], ['coral-guard', 2], ['kindle', 2],
  ['riptide', 3], ['tidewall', 2], ['kelp-snare', 2], ['bloom', 2],
  ['tidecaller', 2], ['undertow', 2], ['spore-burst', 2], ['pearl-shot', 2],
  ['wildfire', 1], ['thornvine', 1], ['crashing-wave', 1],
  ['magma-bloom', 1], ['reefquake', 1],
];

export function cardById(id) {
  return CARD_DEFS.find((c) => c.id === id);
}

// mulberry32: a tiny deterministic RNG so a seed replays the same shuffle.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildDeck(seed) {
  const rng = makeRng(seed);
  const cards = [];
  for (const [id, count] of DECK_LIST) {
    for (let i = 0; i < count; i++) cards.push({ ...cardById(id), uid: `${id}-${i}` });
  }
  // Fisher-Yates shuffle.
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function drawFrom(deck, hand, count) {
  const drawn = [];
  for (let i = 0; i < count && deck.length > 0; i++) {
    const card = deck.pop();
    hand.push(card);
    drawn.push(card);
  }
  return drawn;
}

// render.js — everything the player sees: the table, the hands, the cards,
// the life bars, the log, and the win/loss flourish. It draws state; it
// never changes the rules. All art is drawn here with CSS and inline SVG —
// no borrowed images, no network.

import { SUITS, cardById } from './deck.js';
import { START_LIFE, lifePercent } from './rules.js';
import { aiIntent } from './ai.js';

// Small inline SVG glyphs, one per suit. Colour comes from the suit.
const GLYPHS = {
  drop: '<svg viewBox="0 0 24 24"><path d="M12 2 C12 2 5 11 5 15 a7 7 0 0 0 14 0 C19 11 12 2 12 2 Z"/></svg>',
  flame: '<svg viewBox="0 0 24 24"><path d="M12 2 C13 6 17 8 17 13 a5 5 0 0 1 -10 0 C7 10 9 8 9 6 C10 8 11 8 12 6 C12 4 12 3 12 2 Z M12 22 a3 3 0 0 0 3 -3 C15 17 13 16 12 16 C11 16 9 17 9 19 A3 3 0 0 0 12 22 Z"/></svg>',
  leaf: '<svg viewBox="0 0 24 24"><path d="M20 4 C10 4 4 10 4 20 C14 20 20 14 20 4 Z M4 20 C8 14 12 10 18 6"/></svg>',
  shell: '<svg viewBox="0 0 24 24"><path d="M12 3 C7 3 3 7 3 12 C3 17 7 20 12 20 C17 20 21 17 21 12 C21 7 17 3 12 3 Z M12 7 L12 20 M12 7 L7 9 M12 7 L17 9 M5 13 L19 13"/></svg>',
};

export function suitGlyph(suit) {
  return GLYPHS[SUITS[suit].glyph] || '';
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

// One face-up card. `index` is its keyboard shortcut (1-7).
export function cardElement(card, index, playable, onPlay) {
  const suit = SUITS[card.suit];
  const node = el('button', `card suit-${card.suit}`);
  node.dataset.uid = card.uid;
  node.style.setProperty('--suit', suit.color);
  node.style.setProperty('--suit-dark', suit.dark);
  if (!playable) node.classList.add('unaffordable');
  if (index !== undefined) node.title = `Press ${index + 1} to play`;

  const cost = el('span', 'cost', String(card.cost));
  const glyph = el('span', 'glyph');
  glyph.innerHTML = suitGlyph(card.suit);
  const name = el('span', 'name', card.name);
  const suitName = el('span', 'suit-name', suit.name.toUpperCase());
  const amount = el('span', 'amount', card.kind === 'strike' ? `⚔ ${card.amount}` : card.kind === 'guard' ? `⛨ ${card.amount}` : card.kind === 'mend' ? `✚ ${card.amount}` : card.kind === 'draw' ? `⇢ ${card.amount}` : `≋ ${card.amount}`);
  const text = el('span', 'text', card.text);
  const key = index !== undefined ? el('span', 'key', String(index + 1)) : null;

  node.append(cost, glyph, name, suitName, amount, text);
  if (key) node.append(key);
  node.addEventListener('click', () => onPlay(card));
  return node;
}

// One face-down card back for the Warden's hand.
export function cardBackElement() {
  const node = el('div', 'card card-back');
  node.innerHTML = '<span class="back-mark">◈</span><span class="back-name">TIDEBREAK</span>';
  return node;
}

export function renderAll(game, ui) {
  renderSides(game, ui);
  renderHands(game, ui);
  renderLog(game, ui);
  renderLastPlayed(game, ui);
  renderScreens(game, ui);
}

function renderSides(game, ui) {
  const p = game.player, e = game.enemy;
  ui.pLife.textContent = `${p.life} / ${START_LIFE}`;
  ui.pLifeBar.style.width = `${lifePercent(p)}%`;
  ui.pShield.textContent = p.shield > 0 ? `🛡 ${p.shield} shield` : '';
  ui.pTide.textContent = `Tide ${p.tide} / ${p.maxTide}`;
  ui.pTidePips.textContent = '●'.repeat(p.tide) + '○'.repeat(Math.max(0, p.maxTide - p.tide));
  ui.pDeck.textContent = `Deck ${p.deck.length}`;
  ui.eLife.textContent = `${e.life} / ${START_LIFE}`;
  ui.eLifeBar.style.width = `${lifePercent(e)}%`;
  ui.eShield.textContent = e.shield > 0 ? `🛡 ${e.shield} shield` : '';
  ui.eDeck.textContent = `Deck ${e.deck.length}`;
  ui.eHandCount.textContent = `${e.hand.length} cards`;
  ui.turnLabel.textContent = `Turn ${game.turn}`;
  ui.intent.textContent = game.phase === 'play' ? aiIntent(game) : '';
  ui.endTurn.disabled = game.phase !== 'play' || ui.busy;
}

function renderHands(game, ui) {
  ui.playerHand.replaceChildren();
  game.player.hand.forEach((card, i) => {
    const playable = game.phase === 'play' && !ui.busy && game.player.tide >= card.cost;
    const node = cardElement(card, i, playable, (c) => ui.onPlayCard(c));
    node.style.setProperty('--i', String(i));
    node.classList.add('dealt');
    ui.playerHand.append(node);
  });
  ui.enemyHand.replaceChildren();
  game.enemy.hand.forEach(() => ui.enemyHand.append(cardBackElement()));
}

function renderLog(game, ui) {
  ui.log.replaceChildren();
  game.log.forEach((line) => ui.log.append(el('li', '', line)));
}

function renderLastPlayed(game, ui) {
  ui.lastPlayed.replaceChildren();
  if (!game.lastPlayed) {
    ui.lastPlayed.append(el('div', 'last-empty', 'No card played yet — play one from your hand.'));
    return;
  }
  const { card, by, resonance } = game.lastPlayed;
  const tag = el('div', 'last-tag', by === 'player' ? 'YOU PLAYED' : 'WARDEN PLAYED');
  const node = cardElement({ ...card }, undefined, true, () => {});
  node.classList.add('mini');
  node.disabled = true;
  if (resonance) node.append(el('span', 'resonance', 'RESONANCE! +2'));
  ui.lastPlayed.append(tag, node);
}

function renderScreens(game, ui) {
  const show = (which) => {
    ui.titleScreen.classList.toggle('hidden', which !== 'title');
    ui.winScreen.classList.toggle('hidden', which !== 'win');
    ui.lossScreen.classList.toggle('hidden', which !== 'loss');
    ui.table.classList.toggle('dimmed', which !== 'play');
  };
  if (game.phase === 'title') show('title');
  else if (game.phase === 'win') show('win');
  else if (game.phase === 'loss') show('loss');
  else show('play');
}

// Floating damage / heal numbers over a life bar.
export function floatText(target, text, kind) {
  const n = el('span', `float-text ${kind}`, text);
  target.append(n);
  setTimeout(() => n.remove(), 1400);
}

// Win flourish: a burst of coloured tide-drops over the table.
export function confetti(table) {
  const colors = ['#2fa8e0', '#f2692e', '#3cb371', '#a06cd5', '#ffd166'];
  for (let i = 0; i < 48; i++) {
    const piece = el('span', 'confetti-piece');
    piece.style.background = colors[i % colors.length];
    piece.style.left = `${8 + Math.random() * 84}%`;
    piece.style.animationDelay = `${Math.random() * 0.7}s`;
    piece.style.animationDuration = `${1.6 + Math.random() * 1.4}s`;
    table.append(piece);
    setTimeout(() => piece.remove(), 3400);
  }
}

export { cardById };

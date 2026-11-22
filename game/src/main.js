// main.js — wiring: input, turn flow, and the screenshot hooks. The rules
// live in rules.js, the Warden in ai.js, the drawing in render.js; this file
// only connects them to the page.
//
// Screenshot hooks (real renders of this same code, used for the entry's
// screenshots): ?shot=title | table | win | loss, with &seed=N for a fixed
// shuffle. ?shot=table plays a few opening moves so the table shows played
// cards, a log and spent tide.

import { createGame, startDuel, playCard, beginPlayerTurn, beginEnemyTurn, checkEnd, START_LIFE } from './rules.js';
import { runEnemyTurn } from './ai.js';
import { renderAll, floatText, confetti } from './render.js';

const $ = (id) => document.getElementById(id);

const ui = {
  table: $('table'),
  titleScreen: $('titleScreen'),
  winScreen: $('winScreen'),
  lossScreen: $('lossScreen'),
  playerHand: $('playerHand'),
  enemyHand: $('enemyHand'),
  log: $('log'),
  lastPlayed: $('lastPlayed'),
  pLife: $('pLife'), pLifeBar: $('pLifeBar'), pShield: $('pShield'),
  pTide: $('pTide'), pTidePips: $('pTidePips'), pDeck: $('pDeck'),
  eLife: $('eLife'), eLifeBar: $('eLifeBar'), eShield: $('eShield'),
  eDeck: $('eDeck'), eHandCount: $('eHandCount'),
  turnLabel: $('turnLabel'), intent: $('intent'),
  endTurn: $('endTurn'),
  busy: false,
  onPlayCard: (card) => playPlayerCard(card),
};

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || 20261122) || 20261122;
let game = createGame(seed);
let enemyTimer = null;

function refresh() {
  renderAll(game, ui);
  if (game.phase === 'win') {
    $('winScore').textContent = `You won with ${game.player.life} life left, on turn ${game.turn}.`;
    confetti(ui.table);
  }
  if (game.phase === 'loss') {
    $('lossScore').textContent = `The Warden stood at ${game.enemy.life} life on turn ${game.turn}.`;
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function playPlayerCard(card) {
  if (ui.busy || game.phase !== 'play') return;
  if (game.player.tide < card.cost) {
    floatText(ui.pLifeBar.parentElement, 'Not enough tide!', 'dmg');
    return;
  }
  const before = game.enemy.life;
  const report = playCard(game, game.player, game.enemy, card);
  if (!report) return;
  if (report.damage) floatText(ui.eLifeBar.parentElement, `-${report.damage}`, 'dmg');
  if (report.healed) floatText(ui.pLifeBar.parentElement, `+${report.healed}`, 'heal');
  refresh();
  if (game.phase !== 'play') return;
}

async function endTurn() {
  if (ui.busy || game.phase !== 'play') return;
  ui.busy = true;
  refresh();
  await wait(350);
  // The Warden draws, its tide rises, then it takes its turn, one card at
  // a time so the player can watch the cards land.
  beginEnemyTurn(game);
  await runEnemyTurn(game, (report) => {
    if (report.damage) floatText(ui.pLifeBar.parentElement, `-${report.damage}`, 'dmg');
    if (report.healed) floatText(ui.eLifeBar.parentElement, `+${report.healed}`, 'heal');
    refresh();
  }, wait);
  ui.busy = false;
  if (game.phase === 'play') {
    beginPlayerTurn(game);
    refresh();
  } else {
    refresh();
  }
}

function newDuel() {
  clearTimeout(enemyTimer);
  ui.busy = false;
  game = createGame(seed + Math.floor(Math.random() * 1000));
  refresh();
}

function begin() {
  startDuel(game);
  refresh();
}

// ---- input: mouse buttons ----
$('startBtn').addEventListener('click', begin);
$('winAgain').addEventListener('click', () => { newDuel(); begin(); });
$('lossAgain').addEventListener('click', () => { newDuel(); begin(); });
$('newGame').addEventListener('click', () => { newDuel(); begin(); });
ui.endTurn.addEventListener('click', endTurn);

// ---- input: keyboard ----
document.addEventListener('keydown', (event) => {
  if (event.key >= '1' && event.key <= '7') {
    const card = game.player.hand[Number(event.key) - 1];
    if (card) playPlayerCard(card);
  } else if (event.key === ' ' || event.key === 'Enter') {
    if (game.phase === 'title') begin();
    else if (game.phase === 'play') { event.preventDefault(); endTurn(); }
  } else if (event.key === 'n' || event.key === 'N') {
    newDuel(); begin();
  } else if (event.key === 'Escape' && game.phase === 'play') {
    game.phase = 'title';
    refresh();
  }
});

// ---- deterministic screenshot setups ----
function setupShot(kind) {
  if (kind === 'title') {
    game.phase = 'title';
  } else if (kind === 'table') {
    startDuel(game);
    // A mid-duel table: turn 3, 4 tide, two cards already played so the
    // table shows spent tide, a log and a last-played card.
    game.turn = 3;
    game.player.maxTide = 4;
    game.player.tide = 4;
    const affordable = game.player.hand.filter((c) => c.cost <= game.player.tide);
    if (affordable[0]) playCard(game, game.player, game.enemy, affordable[0]);
    const second = game.player.hand.filter((c) => c.cost <= game.player.tide);
    if (second[0]) playCard(game, game.player, game.enemy, second[0]);
    game.enemy.life = 22;
    game.player.life = 26;
    game.player.shield = 4;
    game.enemy.shield = 2;
  } else if (kind === 'win') {
    startDuel(game);
    game.turn = 6;
    game.enemy.life = 0;
    game.player.life = 14;
    game.player.shield = 6;
    checkEnd(game);
  } else if (kind === 'loss') {
    startDuel(game);
    game.turn = 6;
    game.player.life = 0;
    game.enemy.life = 18;
    checkEnd(game);
  }
  refresh();
}

const shot = params.get('shot');
if (shot) setupShot(shot);
else refresh();

// Exposed for automated play-testing only (not used by the game itself).
window.__game = { get game() { return game; }, begin, endTurn, playPlayerCard, newDuel };

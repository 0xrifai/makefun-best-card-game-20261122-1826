[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![Rank](https://make.fun/badge/best-card-game-20261122-1826/0xrifai/makefun-best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![Reward](https://make.fun/badge/best-card-game-20261122-1826/0xrifai/makefun-best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

# Tidebreak Duel

A card duel on a living reef — you are the Tidebreaker, facing the Reef Warden across the table for the last pearl of the drowned city. Built for the [make.fun best card game bounty](https://make.fun/bounty/best-card-game-20261122-1826).

## How to play

- **Goal:** reduce the Warden's life from 30 to 0 before yours falls.
- **Each turn:** your tide grows by 1 (up to 8), you draw a card, then play cards by clicking them or pressing **1–7**. **Space** ends your turn, **N** starts a new duel.
- **Resonance:** play two cards of the same suit in one turn and the second gains **+2**.
- **Read the Warden:** its intent is shown above its hand. When it gathers tide, a heavy card is coming — hit it now, or raise shield.

Four suits, told apart by colour **and** shape: Wave (blue droplet, strikes), Ember (orange flame, fast and cheap), Kelp (green leaf, heals), Coral (violet shell, guards and draws).

## Run it

```sh
node serve.ts   # then open http://localhost:8080
```

No build step, no network: `game/` is plain static files and plays offline in desktop Chrome.

## Layout

- `game/index.html` — the table, title, win and loss screens
- `game/style.css` — reef-table look, card art, slide/flip/confetti animation
- `game/src/deck.js` — the 16 cards, the 30-card deck, the seeded shuffle
- `game/src/rules.js` — turns, tide, resonance combos, damage and shields
- `game/src/ai.js` — the Reef Warden: greedy, telegraphed, counterable
- `game/src/render.js` — hands, life bars, battle log, win flourish
- `game/src/main.js` — input, turn flow, `?shot=` screenshot hooks
- `main.ts` — the make.fun entrypoint: copies `game/` + `screenshots/` to `/output` and writes `dossier.json`

MIT licensed. All art is drawn with CSS and inline SVG — no borrowed assets.

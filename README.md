# Monster Battle Stadium

A real-time, top-down monster battle game with HD pixel art, built with plain HTML5 Canvas + JavaScript (no build step, no dependencies).

You control your monster directly: move anywhere in the arena and fire off four moves (projectiles, beams, dashes, shockwaves, targeted strikes, buffs and heals). Each trainer brings a team of up to 6; knock out every enemy monster to win.

## Play

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

### Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move | WASD / arrow keys | Left thumb-stick (appears where you touch) |
| Moves 1–4 | J K L ; (or 1–4, Space = move 1) | Move buttons (bottom right) |
| Pause | P / Esc | Pause button |
| Mute | M | Title screen toggle |

Moves auto-aim at your opponent; the skill is in positioning and dodging.

## Features

- 12 original monsters across 12 types, with a type-effectiveness chart and same-type bonus
- Move kinds: projectile, homing, beam (charge + sustained, spiral-ring visuals), dash, burst, delayed zone strikes (lightning, meteors, rock slides), buffs, heals
- Status effects: paralysis, burn, freeze, plus slows
- Held items (damage boosts, regen, speed, defence, cooldown)
- CPU opponent with 3 difficulties (dodges projectiles, beams and telegraphed zones; picks matchups when switching)
- 3 stages: Snowy Summit, Ember Crater, Verdant Meadow — procedurally textured with weather
- Battle HUD: portraits, type/status/item tags, HP bars with damage trail, team balls, timer, move callouts, damage numbers, "FAINTED!" banners
- Synthesised sound effects (WebAudio)

## Code layout

| File | Purpose |
| --- | --- |
| `js/data.js` | Types, type chart, moves, items, roster, AI difficulty |
| `js/pixel.js` | Pixel-art toolkit (shaded shapes, auto-outline, bitmap digits, trainer sprites) |
| `js/sprites.js` | Procedural monster designs |
| `js/arena.js` | Stage generation |
| `js/battle.js` | Simulation, AI, effects and rendering |
| `js/ui.js` / `js/main.js` | HUD, menus, team select, game loop |
| `js/input.js` / `js/audio.js` | Keyboard/touch input, sound |

To add a monster: add a draw function to `MONSTER_ART` in `sprites.js` and an entry to `ROSTER` in `data.js` (moves come from `MOVES`).

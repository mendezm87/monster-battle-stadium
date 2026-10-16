# Monster Battle Stadium

A real-time, top-down monster battle game with HD pixel art, built with plain HTML5 Canvas + JavaScript (no build step, no dependencies).

You control your monster directly: move anywhere in the arena and fire off four moves (projectiles, beams, dashes, shockwaves, targeted strikes, buffs and heals). Each trainer brings a team of up to 6; knock out every enemy monster to win. Play against the CPU, or against a friend on the same device.

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
| Swap monster | Q or Tab (next healthy teammate) | SWAP button, then tap a teammate |
| Pause | P / Esc (Esc only in 2-player) | Pause button |
| Mute | M | Title screen toggle |

Moves auto-aim at your opponent; the skill is in positioning and dodging.

### 2 players

Pick **2 Players** on the title screen. Each player picks a team, then you fight on one screen.

| Action | Player 1 | Player 2 |
| --- | --- | --- |
| Move | WASD | Arrow keys |
| Moves 1–4 | R T F G | I O K L (or numpad 1–4) |
| Swap monster | Q | P (or numpad 0 / Enter) |

On a phone or tablet, Player 2 sits across the table: their stick and buttons appear upside down along the top edge, and HP bars float over each monster. Gamepads also work (two pads = one per player): stick or d-pad to move, A B X Y for moves, either bumper to swap, Start to pause.

## Features

- 18 original monsters covering all 18 types, with the full type-effectiveness chart (immunities softened to ¼ damage) and same-type bonus
- Every type has a beam move, each with its own layered beam sound
- Move kinds: projectile, homing, beam (charge + sustained, spiral-ring visuals), dash, burst, delayed zone strikes (lightning, meteors, rock slides), buffs, heals
- Status effects: paralysis, burn, poison, freeze, plus slows
- Held items (damage boosts, regen, speed, defence, cooldown)
- Local 2-player mode: shared keyboard, tabletop touch screen or two gamepads
- CPU opponent with 3 difficulties (dodges projectiles, beams and telegraphed zones; picks matchups when switching)
- 3 stages: Snowy Summit, Ember Crater, Verdant Meadow — procedurally textured with weather
- Battle HUD: portraits, type/status/item tags, HP bars with damage trail, team balls, timer, move callouts, damage numbers, "FAINTED!" banners
- Original Game Boy-style battle music and synthesised sound effects, including charged beam blasts (WebAudio, no audio files)

## Code layout

| File | Purpose |
| --- | --- |
| `js/data.js` | Types, type chart, moves, items, roster, AI difficulty |
| `js/pixel.js` | Pixel-art toolkit (shaded shapes, auto-outline, bitmap digits, trainer sprites) |
| `js/sprites.js` | Procedural monster designs |
| `js/arena.js` | Stage generation |
| `js/battle.js` | Simulation, AI, effects and rendering |
| `js/ui.js` / `js/main.js` | HUD, menus, team select, game loop |
| `js/input.js` / `js/audio.js` | Keyboard/touch/gamepad input for 1–2 players, sound |

To add a monster: add a draw function to `MONSTER_ART` in `sprites.js` and an entry to `ROSTER` in `data.js` (moves come from `MOVES`).

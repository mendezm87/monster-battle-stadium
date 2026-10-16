# Monster Battle Stadium

Real-time, top-down HD pixel-art monster battle game, inspired by a "Pokemon Battlegrounds" YouTube short. Plain HTML5 Canvas + vanilla JS: no build step, no dependencies, no asset files. Scripts load as classic `<script>` tags in `index.html` (globals, not ES modules), so the page also works from `file://`. Runs on phone (touch) and desktop (keyboard).

## Where things live

- Repo: `mendezm87/monster-battle-stadium` (public). Working branch: `claude/video-accessibility-check-rdngdp`, currently the only branch.
- Playable claude.ai artifact (private to the owner): https://claude.ai/artifact/WCtXTByw25XMPjxCvRBfk8. It's published from a copy of `index.html` with only the body content, plus `css/` and `js/` as supporting files.
- GitHub Pages (once the owner enables it from that branch's root): https://mendezm87.github.io/monster-battle-stadium/

## Decisions already made (keep these)

- **Original IP only.** Monsters, names and sprites are original designs, never Pokémon or Nintendo assets.
- **Music is an original chiptune** in the style of the Gold/Silver Mt. Silver Red battle. Never transcribe the real melody.
- **Swapping mid-fight does not pause the game.** The swapping side is briefly open to attack, with an 8 s cooldown. HP and status carry over.
- **Beam sound:** Normal is the base sound. Every other type adds a flavour layer (`BEAM_LAYERS` in `js/audio.js`), level-balanced through `LAYER_GAIN`.
- Type immunities are softened to 0.25×, because a zero-damage matchup is frustrating in real time.

## Code map

| File | Purpose |
| --- | --- |
| `js/data.js` | `TYPES` (colours and FX palettes), `CHART`, `MOVES`, `ITEMS`, `ROSTER`, `DIFFICULTY` |
| `js/pixel.js` | `PixGrid` (shaded ellipses and polygons, auto-outline), bitmap digits, trainer sprites |
| `js/sprites.js` | `MONSTER_ART[id](grid)`, the procedural monster designs (32px, or 44px for size `L`) |
| `js/arena.js` | Stage generation; `W`/`H` = 288×512 world, `FIELD` bounds |
| `js/battle.js` | `Mon`, `AI`, `Battle`: simulation, effects, rendering (canvas is 2× world; sprites drawn at `SPR_SCALE` 1.5) |
| `js/audio.js` | `Sfx`: synthesized SFX, `beamCharge`/`beamFire` + per-type layers, `Sfx.music` sequencer |
| `js/ui.js`, `js/main.js` | HUD, callouts, swap tray, menus, team select, game loop |
| `js/input.js` | Keyboard (WASD/arrows, J K L ;, Q/Tab swap, P pause, M mute) and touch stick/buttons |

**Adding a monster:** add an art function to `MONSTER_ART` in `sprites.js`, plus a `ROSTER` entry in `data.js` (types, hp, atk, def, spd, size, item, 4 move ids). **Adding a type:** extend `TYPES`, add a `CHART` row and its column entries, and add a `BEAM_LAYERS` entry with a `LAYER_GAIN` value.

## Testing

There is no test suite. Check changes in headless Chromium through Playwright (installed globally):

- Serve the repo with `python3 -m http.server 8137`. `window.__MBS` exposes app state (`__MBS.battle`).
- To bot-play a whole battle, override `Input.dir`/`Input.moves` so they drive an `AI` on the player's side. Watch for page errors and check battle length (a 6v6 runs about 70–95 s).
- `Sfx._offline(offlineCtx, fn)` renders audio into an `OfflineAudioContext`, and `Sfx.music._scheduleAll(seconds)` schedules the song up front. Use these to check levels for clipping (no audio is audible in the container).

## Open ideas (not decided)

- Six monsters in new types (Flying, Poison, Bug, Ghost, Steel, Fairy) to reach 18 types. The owner hasn't chosen a count yet.
- Beam moves for more types. Their sound layers already exist; only normal, water, ice, dragon and psychic have beams today.
- A possible 2-player mode.

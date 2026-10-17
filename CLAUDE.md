# Monster Battle Stadium

Real-time, top-down HD pixel-art monster battle game, inspired by a "Pokemon Battlegrounds" YouTube short. Plain HTML5 Canvas + vanilla JS: no build step, no asset files, and no dependencies except PeerJS, which is loaded from a CDN only when someone opens the online menu. Scripts load as classic `<script>` tags in `index.html` (globals, not ES modules), so the page also works from `file://`. Runs on phone (touch), desktop (keyboard) and gamepads, for 1 player vs the CPU, 2 local players, or 2 players online.

## Where things live

- Repo: `mendezm87/monster-battle-stadium` (public). Everything lives on `main`, the default and only branch.
- Playable claude.ai artifact (private to the owner): https://claude.ai/artifact/WCtXTByw25XMPjxCvRBfk8. It's published from a copy of `index.html` with only the body content, plus `css/` and `js/` as supporting files.
- GitHub Pages (live, public): https://mendezm87.github.io/monster-battle-stadium/ . It serves the root of `main`. Pages rebuilds on push, and a manual rebuild is `gh api -X POST repos/mendezm87/monster-battle-stadium/pages/builds`.

## Workflow

- **Always push after committing** unless the owner says otherwise for that piece of work; no need to ask first, since changes can be rolled back.
- **Work directly on `main`.** The owner doesn't want a clutter of branches; only make a branch if they ask for one, and merge and delete it when done.

## Decisions already made (keep these)

- **Original IP only.** Monsters, names and sprites are original designs, never Pokémon or Nintendo assets.
- **Smugshi is the owner's real dog, Toshi** (a red Shiba Inu with a cream mask, white socks, white eyebrow spots, a big curled tail and a famously smug half-closed stare). Keep his look and personality: Zoomies, Shiba Scream, Smug Beam, Blanket Nap. Tuned to a 50% bot round-robin win rate.
- **Music is an original chiptune** in the style of the Gold/Silver Mt. Silver Red battle. Never transcribe the real melody.
- **Swapping mid-fight does not pause the game.** The swapping side is briefly open to attack, with an 8 s cooldown. HP and status carry over.
- **Beam sound:** Normal is the base sound. Every other type adds a flavour layer (`BEAM_LAYERS` in `js/audio.js`), level-balanced through `LAYER_GAIN`.
- **18 types, matching the real games' type list and chart.** Type immunities are softened to 0.25×, because a zero-damage matchup is frustrating in real time.
- **Every type has a beam move.** To make room, some older monsters swapped a move for their type's beam (e.g. Sparkit's Quick Hit became Volt Cannon).
- **Poison status (PSN):** 2.5% max HP per second for 8 s, no attack drop. Poison and Steel types are immune.
- **Online 2-player is host-authoritative over WebRTC (PeerJS + its free public signalling server).** The host runs the normal `Battle` with `p2Input` fed from the network; the guest builds a `Battle` with `puppet: true, flip: true`, never simulates, and draws snapshots (`js/net.js`, 20 per second, kept under PeerJS's ~16 KB JSON message limit by packing and capping particles). Between snapshots the guest moves things along their velocities. Sounds, callouts, banners and scorch marks are recorded on the host and replayed. The host owns pause, swaps, replacement picks and the result.
- **Each online player sees their own side.** `Battle.flip` turns the arena 180° about the field centre (`MIRROR_Y`) but keeps sprites upright: anything drawn k above its ground spot is placed with `sy(y, k)`, and particles, numbers and texts carry `g`, their ground anchor. `UI.mySide` makes the HUD, callouts, move buttons and swap tray follow the guest's side. The guest's stick is negated before it is sent, because its view is rotated.
- **Local 2-player** (no network): a shared keyboard, a tabletop touch screen with player 2's controls rotated 180° along the top, or one gamepad per player. Player 2 is the top (`enemy`) side; `Battle.ai` is null in 2P. In tabletop mode the HUD panels hide and `Battle.drawBars` draws HP bars over each monster.

## Code map

| File | Purpose |
| --- | --- |
| `js/data.js` | `TYPES` (colours and FX palettes), `CHART`, `MOVES`, `ITEMS`, `ROSTER`, `DIFFICULTY` |
| `js/pixel.js` | `PixGrid` (shaded ellipses and polygons, auto-outline), bitmap digits, trainer sprites |
| `js/sprites.js` | `MONSTER_ART[id](grid)`, the procedural monster designs (32px, or 44px for size `L`) |
| `js/arena.js` | Stage generation; `W`/`H` = 288×512 world, `FIELD` bounds |
| `js/battle.js` | `Mon`, `AI`, `Battle`: simulation, effects, rendering (canvas is 2× world; sprites drawn at `SPR_SCALE` 1.5) |
| `js/audio.js` | `Sfx`: synthesized SFX, `beamCharge`/`beamFire` + per-type layers, `Sfx.music` sequencer |
| `js/ui.js`, `js/main.js` | HUD, callouts, swap tray, menus, team select, online lobby and message flow, game loop |
| `js/net.js` | `Net`: PeerJS host/join with 5-letter room codes, host snapshots + recorded events, guest playback and input |
| `js/input.js` | Keyboard, touch and gamepad input for players 0 and 1. `Input.dir(p)`/`Input.moves(p)`; `Input.setMode('solo'|'duo')` switches key layouts (solo: WASD/arrows, J K L ;, Q/Tab swap, P pause; duo: P1 WASD + R T F G + Q, P2 arrows + I O K L + P, Esc pauses) |

**Adding a monster:** add an art function to `MONSTER_ART` in `sprites.js`, plus a `ROSTER` entry in `data.js` (types, hp, atk, def, spd, size, item, 4 move ids). **Adding a type:** extend `TYPES`, add a `CHART` row and its column entries, and add a `BEAM_LAYERS` entry with a `LAYER_GAIN` value.

## Testing

There is no test suite. Check changes in headless Chromium through Playwright (installed globally):

- **Always test with the sound off.** Right after every page load, run `if (!Sfx.muted) toggleMute()` (mute resets on reload). Offline audio renders for level checks are silent and fine.

- Serve the repo with `python3 -m http.server 8137`. `window.__MBS` exposes app state (`__MBS.battle`).
- To bot-play a whole battle, override `Input.dir(p)`/`Input.moves(p)` so they drive an `AI` on the player's side (and on player 2's side in 2P). Stepping `battle.update(1/60)` in a loop runs a battle in well under a second; stub `UI.pickNext` to auto-pick. Watch for page errors and check battle length (a 6v6 runs about 50–140 s with hard bots).
- Balance check: a 1v1 round robin of every monster with hard bots on both sides. After adding the 6 new monsters, every one of them won 40–66% of its 1v1s. The original 12 range from Shadefang at ~21% to Mindra at ~71%, so hard bots favour ranged kits.
- Online: open two tabs, host in one and join with its code in the other (needs internet for the PeerJS server). Hidden tabs throttle `requestAnimationFrame`, so drive each tab with `setInterval(() => frame(performance.now()), 16)`; the host auto-pauses when its tab is hidden. Setting `window.__netStats = {}` on the host records total and largest message sizes.
- `Sfx._offline(offlineCtx, fn)` renders audio into an `OfflineAudioContext`, and `Sfx.music._scheduleAll(seconds)` schedules the song up front. Use these to check levels for clipping (no audio is audible in the container).

## Open ideas (not decided)

- **A TURN relay for online play.** PeerJS's built-in relay (`*.turn.peerjs.com`) no longer resolves, and the free Open Relay shared login stopped working, so today online play only works when the two devices can link directly (same Wi-Fi is the safe bet; mobile data often fails). `js/net.js` has a `TURN_URL` hook: set it to a provider endpoint that returns a JSON `iceServers` array (e.g. a free Metered.ca app's credentials URL) and relays are used automatically. This needs the owner to create the provider account.
- Online play from the claude.ai artifact hasn't been tried; its sandbox may block the PeerJS server. GitHub Pages is the safe host for online play.
- Rebalance the weakest originals (Shadefang, Sparkit, Frostling) if human play agrees with the bot round robin.
- Gamepad support is written to the standard mapping but hasn't been tried with real hardware yet.

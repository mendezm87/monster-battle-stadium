# Monster Battle Stadium

Real-time, top-down HD pixel-art monster battle game, inspired by a "Pokemon Battlegrounds" YouTube short. Plain HTML5 Canvas + vanilla JS: no build step, no asset files, and no dependencies except PeerJS, which is loaded from a CDN only when someone opens the online menu. Scripts load as classic `<script>` tags in `index.html` (globals, not ES modules), so the page also works from `file://`. Runs on phone (touch), desktop (keyboard) and gamepads, for 1 player vs the CPU, 2 local players, or 2 players online.

## Where things live

- Repo: `mendezm87/monster-battle-stadium` (public). Everything lives on `main`, the default and only branch.
- Playable claude.ai artifact (private to the owner): https://claude.ai/artifact/WCtXTByw25XMPjxCvRBfk8. It's published from a copy of `index.html` with only the body content, plus `css/` and `js/` as supporting files.
- GitHub Pages (live, public): https://mendezm87.github.io/monster-battle-stadium/ . It serves the root of `main`. Pages rebuilds on push, and a manual rebuild is `gh api -X POST repos/mendezm87/monster-battle-stadium/pages/builds`.

## Workflow

- **Always push after committing** unless the owner says otherwise for that piece of work; no need to ask first, since changes can be rolled back.
- **Work directly on `main`.** The owner doesn't want a clutter of branches; only make a branch if they ask for one, and merge and delete it when done.
- **Bump `VERSION` in `js/main.js` with every change you push** (format `YYYY.MM.DD-rN`). It shows on the title screen, so the owner can check that a device is not running a cached older build (GitHub Pages lets browsers cache files for up to 10 minutes).

## Decisions already made (keep these)

- **Original IP only.** Monsters, names and sprites are original designs, never Pokémon, Nintendo, Palworld or other games' assets. When the owner asks for a character "like" one from another game, make an original monster with a similar vibe instead (e.g. Mondaze, a burnt-out coffee sloth, was the answer to "something like Palworld's Depresso").
- **Smugshi is the owner's real dog, Toshi** (a red Shiba Inu with a cream mask, white socks, white eyebrow spots, a big curled tail and a famously smug half-closed stare). Keep his look and personality: Zoomies, Shiba Scream (with its own synthesized "AAAAAH" sound, `shibaScream` in `js/audio.js`, picked via the move's `sfx` field), Smug Beam, Blanket Nap. Tuned to a 50% bot round-robin win rate.
- **Music is an original chiptune** in the style of the Gold/Silver Mt. Silver Red battle. Never transcribe the real melody.
- **Swapping mid-fight does not pause the game.** The swapping side is briefly open to attack, with an 8 s cooldown. HP and status carry over.
- **Beam sound:** Normal is the base sound. Every other type adds a flavour layer (`BEAM_LAYERS` in `js/audio.js`), level-balanced through `LAYER_GAIN`.
- **18 types, matching the real games' type list and chart.** Type immunities are softened to 0.25×, because a zero-damage matchup is frustrating in real time.
- **Not every monster needs a beam** (the owner's call). 16 of 20 have one; Galewing, Scarablade, Lumawool and Boulderon traded theirs for one of the newer move kinds. Beam sound layers stay for every type.
- **Move kinds** (see the comment above `MOVES` in `js/data.js`): projectile, beam, dash, burst, zone, buff, heal, vortex, plus modifiers `drain`, `boomerang`, `hits` (combo dash) and `linger` (pools). Any new kind needs four things: battle code, network sync and flipped-view drawing for online, CPU use and dodging (`AI.pick` / `AI.threat`), and a sound.
- **Balance lesson:** a beam roots its user while it charges and fires, so removing one makes a fast monster much stronger against bots (Galewing jumped from ~40% to ~70%). When swapping a monster's moves, re-check its stats, not just the new move's numbers.
- **Poison status (PSN):** 2.5% max HP per second for 8 s, no attack drop. Poison and Steel types are immune.
- **Online 2-player is host-authoritative over WebRTC (PeerJS + its free public signalling server).** The host runs the normal `Battle` with `p2Input` fed from the network; the guest builds a `Battle` with `puppet: true, flip: true`, never simulates, and draws snapshots (`js/net.js`, 20 per second, kept under PeerJS's ~16 KB JSON message limit by packing and capping particles). Between snapshots the guest moves things along their velocities. Sounds, callouts, banners and scorch marks are recorded on the host and replayed. The host owns pause, swaps, replacement picks and the result.
- **Each online player sees their own side.** `Battle.flip` turns the arena 180° about the field centre (`MIRROR_Y`) but keeps sprites upright: anything drawn k above its ground spot is placed with `sy(y, k)`, and particles, numbers and texts carry `g`, their ground anchor. `UI.mySide` makes the HUD, callouts, move buttons and swap tray follow the guest's side. The guest's stick is negated before it is sent, because its view is rotated.
- **Online play uses the owner's Metered.ca TURN relay** (free plan, app `monsterbattle`) when a direct link fails. PeerJS's own relay is dead, and even two devices on the same home Wi-Fi often can't link directly (browsers hide local addresses and many routers don't loop traffic back), so the relay matters. `TURN_URL` in `js/net.js` holds the credentials URL; its `apiKey` is Metered's front-end key (it can only fetch relay logins), so it's fine in this public repo. The free plan has a monthly data cap; a relayed match uses roughly 45 MB an hour.
- **Local 2-player** (no network): a shared keyboard, a tabletop touch screen with player 2's controls rotated 180° along the top, or one gamepad per player. Player 2 is the top (`enemy`) side; `Battle.ai` is null in 2P. In tabletop mode the HUD panels hide and `Battle.drawBars` draws HP bars over each monster.

## Custom move sets (owner's request, 2026-10-17)

On the team screen, tapping one of a monster's moves opens the moves it can learn; picking one swaps it in (a move already in the set trades places). Rules in `js/movesets.js`: the pool is the monster's own moves plus moves other monsters know of its types or its types' themed **coverage** types (`COVERAGE`, like learnsets: fire also learns ground, dragon and normal), except **signature moves** (Smugshi's, Mondaze's and Smugshogun's) and moves only an evolved form knows, which stay with their owner. A set is 4 different moves with at least one that deals damage. Sets are saved per player in this browser (`mbs.movesets.v1`; player 2 has their own in local 2-player). Teams go into `Battle` as ids or `{ id, moves }`; `validSet` checks every set (bad or unknown ones fall back to the defaults, which also guards online). Online, your sets travel with your team. The CPU always uses default sets. Pools give each monster 7-26 extra moves; balance with custom sets hasn't been tuned (the 1v1 round-robin numbers are for default sets).

## Shared with Monster Rush (ported 2026-10-17)

The owner's roguelike, **Monster Rush** (`mendezm87/monster-rush`), started as a copy of this game. **The owner's rule: improvements made there that make sense here get ported, especially visuals.** Its CLAUDE.md has the full story of each feature. Ported so far (r2):

- **Monster art**: `js/sprites.js`, `js/monsters.js` and the `js/monsters/` folder (one art file per monster family, since Rush r58) are Rush's files as-is; monsters are drawn when first needed (`SPRITES` draws on first use). Every monster has `front`, `side`, `back` and the two diagonals `fside`/`bside` (8-way turning, `viewFor()`/`isSideView()`); `Mon.look(dx, dy)` sets `m.view` and `m.face`. Player monsters start on their back view (facing the enemy). Toshi (Smugshi) is redrawn from the owner's photos. `ALL_MONS` (data.js) lists the monsters that have art.
- **Attack art**: `js/fx.js` is Rush's file as-is (chunky outlined pixel effects in their own layer, `FXLayer`, one pixel = one sprite pixel; a look per type; signature looks via a move's `fx` tag: wheel, bubble, mud, claw, roll, slash, stare, pin, breeze; heals act out their names). battle.js calls `fxImpact`, `fxBlast`, `fxBuff`, `fxHeal` and adds dash streaks; it has `mixInto`, `foes(m)` and `mons` for fx.js. **The online guest's turned-round view (`flip`) still draws the old simple effects** (`drawBeamFlat`, `drawProjectileFlat`, `drawZoneFallsFlat`, `drawParticlesFlat`), because fx.js draws in world space and the flipped view needs things kept upright about their ground spot; the host packs the new particle kinds as their nearest simple shape (`packParticle` in net.js). Porting the new art to the guest view is still to do.
- **Sounds**: `js/audio.js` is Rush's file as-is: every non-beam move has a sound (`Sfx.move(mv, phase)`, phases cast / release / land / hit; type flavours; signature sounds; fire roars, dark is audible on phones, Thunder cracks and rolls), plus Rush's music engine with several songs; each stage has its song (`STAGE_SONGS` in arena.js: summit = Summit Wind, crater = Magma March, meadow = Rush). Online: the host records `Sfx.move` calls (`rec.mv`) and the guest replays them.
- **Crisp scaling**: `RES` (arena.js) is canvas pixels per world unit, always even; `fitScreen` in main.js picks it from the screen's real pixels; draw with `setTransform(RES, ...)`, never assume a 2x canvas.
- **Bundled font** (`fonts/`, `css/fonts.css`, SIL OFL) and `serve.py` (a no-cache local server).

Not ported (Rush-only or gameplay that would need its own balance and network work here): rooms, relics, the bot test page, settings/saves, lighting, and Rush's move changes (Blizzard cone, Dark Pulse ripple, Close Combat flurry, Gust, Tornado, Wool Tackle and the new movesets). Ask the owner before porting gameplay changes.

## Code map

| File | Purpose |
| --- | --- |
| `js/data.js` | `TYPES` (colours and FX palettes), `CHART`, `MOVES`, `ITEMS`, `ROSTER`, `DIFFICULTY` |
| `js/pixel.js` | `PixGrid` (shaded ellipses and polygons, auto-outline), bitmap digits, trainer sprites |
| `js/sprites.js` | `MONSTER_ART[id](grid, view)` and `MONSTER_ART_DIAG`: the monster designs (32px, or 44px for size `L`) in 5 views (shared with Monster Rush) |
| `js/describe.js` | Plain-language move and item descriptions (`moveDesc`, `moveStats`, `itemDesc`, `typeMatchups`) and hover tooltips (`data-tip="mv:id"`, `item:`, `type:`, `status:`). **Shared with Monster Rush**: keep both copies identical |
| `js/movesets.js` | Custom move sets: `movePool`, `validSet`, `MoveSets` (saved choices, `team(p, ids)`). **Shared with Monster Rush** (where monsters learn moves from these pools during runs): keep both copies identical |
| `js/fx.js` | Attack art (shared with Monster Rush): `FXLayer`, `FXD` helpers, `FX_PARTS`, the drawing of shots, beams, blasts and effects |
| `js/arena.js` | Stage generation; `W`/`H` = 288×512 world, `FIELD` bounds |
| `js/battle.js` | `Mon`, `AI`, `Battle`: simulation, effects, rendering (canvas is 2× world; sprites drawn at `SPR_SCALE` 1.5) |
| `js/audio.js` | `Sfx`: synthesized SFX, `beamCharge`/`beamFire` + per-type layers, `Sfx.music` sequencer |
| `js/ui.js`, `js/main.js` | HUD, callouts, swap tray, menus, team select, online lobby and message flow, game loop |
| `js/net.js` | `Net`: PeerJS host/join with 5-letter room codes, host snapshots + recorded events, guest playback and input |
| `js/input.js` | Keyboard, mouse (1-player/online: left/right click = moves 1/2, Shift + click = moves 3/4; `Input.mouse` switches it on per battle), touch and gamepad input for players 0 and 1. `Input.dir(p)`/`Input.moves(p)`; `Input.setMode('solo'|'duo')` switches key layouts (solo: WASD/arrows, J K L ;, Q/Tab swap, P pause; duo: P1 WASD + R T F G + Q, P2 arrows + I O K L + P, Esc pauses) |

**Adding a monster:** add its art file in `js/monsters/` (listed in `js/monsters.js`; usually made in Rush first), plus a `ROSTER` entry in `data.js` (types, hp, atk, def, spd, size, item, 4 move ids). **Adding a type:** extend `TYPES`, add a `CHART` row and its column entries, and add a `BEAM_LAYERS` entry with a `LAYER_GAIN` value.

## Testing

There is no test suite. Check changes in headless Chromium through Playwright (installed globally):

- **Always test with the sound off.** Right after every page load, run `if (!Sfx.muted) toggleMute()` (mute resets on reload). Offline audio renders for level checks are silent and fine.

- Serve the repo with `python serve.py 8138` (a no-cache server; 8137 is Monster Rush's). `window.__MBS` exposes app state (`__MBS.battle`).
- To bot-play a whole battle, override `Input.dir(p)`/`Input.moves(p)` so they drive an `AI` on the player's side (and on player 2's side in 2P). Stepping `battle.update(1/60)` in a loop runs a battle in well under a second; stub `UI.pickNext` to auto-pick. Watch for page errors and check battle length (a 6v6 runs about 50–140 s with hard bots).
- Balance check: a 1v1 round robin of every monster with hard bots on both sides. After adding the 6 new monsters, every one of them won 40–66% of its 1v1s. The original 12 range from Shadefang at ~21% to Mindra at ~71%, so hard bots favour ranged kits.
- Online: open two tabs, host in one and join with its code in the other (needs internet for the PeerJS server). Hidden tabs throttle `requestAnimationFrame`, so drive each tab with `setInterval(() => frame(performance.now()), 16)`; the host auto-pauses when its tab is hidden. Setting `window.__netStats = {}` on the host records total and largest message sizes.
- `Sfx._offline(offlineCtx, fn)` renders audio into an `OfflineAudioContext`, and `Sfx.music._scheduleAll(seconds)` schedules the song up front. Use these to check levels for clipping (no audio is audible in the container).

## Open ideas (not decided)

- Online play from the claude.ai artifact hasn't been tried; its sandbox may block the PeerJS server. GitHub Pages is the safe host for online play.
- Rebalance the weakest originals (Shadefang, Sparkit, Frostling) if human play agrees with the bot round robin.
- Gamepad support is written to the standard mapping but hasn't been tried with real hardware yet.

## Flying monsters (r7, ported from Monster Rush r35)

Galewing, Pixibelle and Drakorn hover over their shadow and flap; Wispurr floats. `FLYERS`, the wing helpers and the flap frames live in the shared `js/sprites.js`; `drawMon` in `js/battle.js` lifts them (`m.hover`), swaps in `SPRITES[id].flap`, and drops them when frozen or fainted. Looks only: hitboxes and attacks are unchanged.

## Animation poses (r8, ported from Monster Rush r36)

`posed`, `tintOf` and `monPose` in the shared `js/sprites.js` bend each monster into poses (bouncy walk, breathing, wind-ups, lunges, hit squish and recoil, pop-in, faint). `drawMon` in `js/battle.js` draws the posed canvas; `hit` sets `m.hurtT`, sending in sets `m.popT`. Online, the guest's `applyMon` (net.js) starts the hit pose when the hit flash appears and the pop when a monster becomes visible, since those timers aren't sent. r9: calmer pacing after the owner found r8 jittery (3-frame hop walk, hit pose on real hits only, slower flaps); see Monster Rush's notes.

## Rigged animation (r10, from Monster Rush r38)

The shared `js/sprites.js` now animates rigged monsters with real frames (`RIGGED`, `RIG_FRAMES`, `part()`, `monAnim`); only Smugshi so far. `drawMon` uses `monAnim(m, phase, flying)`'s `views` and draws them through `posed`. Unrigged monsters just hop. r12: move poses, lying-down faint and body-type templates (Smugshi, Brawlix, Wispurr rigged); cast actions carry `mv` and `pose`, sent to online guests as `po`. r13: every monster rigged (shared sprites.js from Monster Rush r41); fliers' rig frames have wings-down twins (`views.flapped`), which drawMon swaps in as they flap. r14: shared sprites.js from Monster Rush r49: Sparkit is redrawn as a plug ferret and Lumawool as a storm ram (same stats and moves); the file also holds Rush's new monsters (Voltergeist, Coilizard, Bellpaca, Smouldox), which aren't in this roster (adding them is a balance call for the owner).

## Monster Rush's new monsters and the legends tier (r23, owner: "add them all")

- **7 new regular monsters** from Rush: Voltergeist (electric/ghost), Coilizard (electric/rock), Bellpaca (electric/normal), Smouldox (fire/rock), and the turtle line Shellmet, Bulwarden and Garrishell (water/steel; here they're separate picks, the arena has no evolving). New moves: Spout Shot, Cuff Cannon, Twin Cannon. **Stats are tuned here for 1v1** (Rush's differ): hard-bot round robin of all 27 regulars, 4 fights per pair, put every new one at 56-63% (Voltergeist 860 HP / 1.0 atk / 92 spd, Coilizard atk 1.04, Shellmet def 1.08, Bulwarden atk 0.93 / def 1.12, Garrishell 1340 HP / 0.95 atk / 1.0 def; at Rush's numbers Voltergeist and Garrishell won ~80%: steel typing resists a lot one on one). Originals in the same run: Boulderon, Mindra, Brawlix ~63% at the top; Shadefang ~24% and Frostling ~18% at the bottom (an open balance question).
- **The legends tier** (`LEGENDS` in data.js, `from` keeps their moves out of other pools): Rush's evolved starters (Smugshogun, Infernox, Maelstrisk) and Garrishell's altar forms (Magma Bastion, Railwarden, Citadrone; Citadrone hovers). Off by default; the team screen's **Legends: Off/On** button (saved as `mbs.legends.v1`) shows them with gold borders and lets the CPU and Random pick them (`pickable()`). Turning it off takes them out of the current teams. They're much stronger on purpose: 66-92% against the whole field. Magma Wave is a big blast all round here (Rush's is a cone; the arena has no cones).
- **Descriptions and tooltips** (`js/describe.js`, shared): move buttons on the team screen say what kind of move they are; picking a slot to swap shows that move's full description; hovering (mouse) any move, type tag, held item or status shows a styled tooltip.
- Round-robin script used (in the browser console, page muted): build `new Battle({ playerTeam: [a], enemyTeam: [b], difficulty: 'hard', stage: 'meadow', ui: stub })`, drive the player side with an `AI(DIFFICULTY.hard)` through `Input.dir`, step `update(1/60)` until `state === 'over'`; 27 monsters × 4 fights per pair takes about 30 s.

## Phone memory (r24, from Monster Rush r67)

Phones cap canvas memory and free discarded canvases late; past the cap new canvases come out blank (vanishing monsters or maps). `numberCanvas` (damage numbers) is now cached (`_numbers`, 400 most recent) and `freeCanvas(c)` (pixel.js) frees a canvas at once; the shared sprites.js has `forgetSprites(keep)` (unused here: the arena only ever draws its fighters). In a fight the arena now makes about no new canvases per frame. Never create a canvas per frame.

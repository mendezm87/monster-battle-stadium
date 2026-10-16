// Game data: types, type chart, moves, items and the monster roster.

const TYPES = {
  normal:   { name: 'NORMAL',   color: '#a8a77a', fx: ['#ff8a2a', '#ffd36b', '#fffbe6'] },
  fire:     { name: 'FIRE',     color: '#ee8130', fx: ['#ff4a1c', '#ffa424', '#fff3b0'] },
  water:    { name: 'WATER',    color: '#6390f0', fx: ['#2f6bff', '#6fb6ff', '#e6f6ff'] },
  grass:    { name: 'GRASS',    color: '#7ac74c', fx: ['#2f9e3a', '#8be04e', '#eaffc8'] },
  electric: { name: 'ELECTRIC', color: '#e8c020', fx: ['#ffc21f', '#fff27a', '#ffffff'] },
  ice:      { name: 'ICE',      color: '#7cc8d8', fx: ['#5ab8e8', '#aeeaff', '#ffffff'] },
  ground:   { name: 'GROUND',   color: '#d4a84e', fx: ['#8a5a2b', '#d6a356', '#f7e2b0'] },
  rock:     { name: 'ROCK',     color: '#b6a136', fx: ['#6e5a3a', '#b59a62', '#efe0b8'] },
  dragon:   { name: 'DRAGON',   color: '#6f35fc', fx: ['#5a2bd6', '#a77bff', '#f1e6ff'] },
  psychic:  { name: 'PSYCHIC',  color: '#f95587', fx: ['#d62f8a', '#ff8ad0', '#ffe6f6'] },
  dark:     { name: 'DARK',     color: '#705746', fx: ['#2a1a3a', '#7a4aa8', '#e2d0ff'] },
  fighting: { name: 'FIGHTING', color: '#c22e28', fx: ['#b0281e', '#ff6a3a', '#ffe0c8'] },
};

// attacker -> defender -> multiplier (missing = 1). Immunities are softened to 0.25
// because a real-time fight with a zero-damage matchup is just frustrating.
const CHART = {
  normal:   { rock: 0.5 },
  fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, rock: 0.5, dragon: 0.5 },
  water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, grass: 0.5, electric: 0.5, ground: 0.25, dragon: 0.5 },
  ice:      { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, dragon: 2 },
  ground:   { fire: 2, grass: 0.5, electric: 2, rock: 2 },
  rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5 },
  dragon:   { dragon: 2 },
  psychic:  { fighting: 2, psychic: 0.5, dark: 0.25 },
  dark:     { psychic: 2, dark: 0.5, fighting: 0.5 },
  fighting: { normal: 2, ice: 2, rock: 2, dark: 2, psychic: 0.5 },
};

function typeEffect(moveType, defTypes) {
  let m = 1;
  for (const t of defTypes) {
    const row = CHART[moveType];
    if (row && row[t] !== undefined) m *= row[t];
  }
  return m;
}

/*
 Move kinds:
  projectile  - fires `count` shots (spread in radians), optional homing / explode radius / slow
  beam        - charges, then a sustained beam that ticks damage; optional recharge stun
  dash        - user rushes toward the target and hits on contact; optional recoil
  burst       - shockwave around the user after a short telegraph
  zone        - marked circles land on/near the target after a delay
  buff        - temporary stat multiplier
  heal        - restores a fraction of max HP
 status: [kind, chance]  (par / brn / frz)
*/
const MOVES = {
  // electric
  voltRush:     { name: 'Volt Rush', type: 'electric', kind: 'dash', power: 300, cd: 5, speed: 330, dur: 0.4, recoil: 0.2, status: ['par', 0.3] },
  thunderbolt:  { name: 'Thunderbolt', type: 'electric', kind: 'projectile', power: 150, cd: 2.2, speed: 250, r: 5, status: ['par', 0.15] },
  thunder:      { name: 'Thunder', type: 'electric', kind: 'zone', power: 270, cd: 6, r: 24, delay: 0.85, status: ['par', 0.3], fx: 'bolt' },
  discharge:    { name: 'Discharge', type: 'electric', kind: 'burst', power: 220, cd: 5, r: 62, delay: 0.45, status: ['par', 0.3] },
  // normal
  quickHit:     { name: 'Quick Hit', type: 'normal', kind: 'dash', power: 95, cd: 1.6, speed: 390, dur: 0.22 },
  megaBeam:     { name: 'Mega Beam', type: 'normal', kind: 'beam', power: 480, cd: 9, charge: 0.75, dur: 0.9, width: 16, len: 330, recharge: 1.3 },
  bodySlam:     { name: 'Body Slam', type: 'normal', kind: 'dash', power: 210, cd: 3.6, speed: 250, dur: 0.45, status: ['par', 0.3] },
  snack:        { name: 'Snack Time', type: 'normal', kind: 'heal', amount: 0.35, cd: 16 },
  // fire
  flameWheel:   { name: 'Flame Wheel', type: 'fire', kind: 'dash', power: 220, cd: 3.5, speed: 300, dur: 0.42, status: ['brn', 0.25] },
  ember:        { name: 'Ember', type: 'fire', kind: 'projectile', power: 70, cd: 1.6, speed: 220, r: 4, count: 3, spread: 0.25, status: ['brn', 0.1] },
  fireBlast:    { name: 'Fire Blast', type: 'fire', kind: 'projectile', power: 330, cd: 7, speed: 165, r: 8, explode: 32, status: ['brn', 0.3] },
  eruption:     { name: 'Eruption', type: 'fire', kind: 'burst', power: 280, cd: 8, r: 62, delay: 0.55, status: ['brn', 0.2] },
  // water
  hydroCannon:  { name: 'Hydro Cannon', type: 'water', kind: 'beam', power: 320, cd: 6.5, charge: 0.5, dur: 0.7, width: 12, len: 270 },
  bubbleBeam:   { name: 'Bubble Spray', type: 'water', kind: 'projectile', power: 55, cd: 2, speed: 170, r: 4, count: 5, spread: 0.5, slow: 1.5 },
  aquaJet:      { name: 'Aqua Jet', type: 'water', kind: 'dash', power: 115, cd: 2.2, speed: 410, dur: 0.25 },
  whirlpool:    { name: 'Whirlpool', type: 'water', kind: 'zone', power: 190, cd: 6, r: 34, delay: 0.9, slow: 2.5 },
  // grass
  razorLeaf:    { name: 'Razor Leaf', type: 'grass', kind: 'projectile', power: 90, cd: 1.8, speed: 255, r: 4, count: 2, spread: 0.15 },
  leafStorm:    { name: 'Leaf Storm', type: 'grass', kind: 'projectile', power: 70, cd: 4.5, speed: 230, r: 4, count: 7, spread: 0.9 },
  seedBomb:     { name: 'Seed Bomb', type: 'grass', kind: 'zone', power: 150, cd: 4.5, r: 22, delay: 0.75, count: 3, scatter: 30 },
  photosynth:   { name: 'Photosynth', type: 'grass', kind: 'heal', amount: 0.3, cd: 14 },
  // ground
  heavyStomp:   { name: 'Heavy Stomp', type: 'ground', kind: 'burst', power: 210, cd: 5, r: 52, delay: 0.5 },
  quake:        { name: 'Quake', type: 'ground', kind: 'burst', power: 300, cd: 8, r: 92, delay: 0.8 },
  mudShot:      { name: 'Mud Shot', type: 'ground', kind: 'projectile', power: 110, cd: 2, speed: 210, r: 5, slow: 2 },
  // ice
  iceShard:     { name: 'Ice Shard', type: 'ice', kind: 'projectile', power: 85, cd: 1.3, speed: 330, r: 3 },
  frostRay:     { name: 'Frost Ray', type: 'ice', kind: 'beam', power: 240, cd: 5.5, charge: 0.4, dur: 0.6, width: 9, len: 270, status: ['frz', 0.2] },
  blizzard:     { name: 'Blizzard', type: 'ice', kind: 'burst', power: 230, cd: 7, r: 72, delay: 0.7, status: ['frz', 0.25] },
  frostArmor:   { name: 'Frost Armor', type: 'ice', kind: 'buff', buff: { def: 1.5 }, dur: 8, cd: 15 },
  // dragon
  dragonPulse:  { name: 'Dragon Pulse', type: 'dragon', kind: 'beam', power: 270, cd: 5, charge: 0.45, dur: 0.55, width: 12, len: 290 },
  dragonClaw:   { name: 'Dragon Claw', type: 'dragon', kind: 'dash', power: 165, cd: 2.4, speed: 340, dur: 0.3 },
  starfall:     { name: 'Starfall', type: 'dragon', kind: 'zone', power: 200, cd: 9, r: 26, delay: 1.0, count: 4, scatter: 50, fx: 'meteor' },
  dragonDance:  { name: 'Dragon Dance', type: 'dragon', kind: 'buff', buff: { atk: 1.3, spd: 1.3 }, dur: 8, cd: 15 },
  // rock
  rockSlide:    { name: 'Rock Slide', type: 'rock', kind: 'zone', power: 145, cd: 4, r: 20, delay: 0.7, count: 4, scatter: 40, fx: 'rock' },
  stoneEdge:    { name: 'Stone Edge', type: 'rock', kind: 'projectile', power: 230, cd: 3.5, speed: 235, r: 6 },
  rollout:      { name: 'Rollout', type: 'rock', kind: 'dash', power: 185, cd: 3.2, speed: 280, dur: 0.55 },
  gemShot:      { name: 'Gem Shot', type: 'rock', kind: 'projectile', power: 140, cd: 2.6, speed: 230, r: 5, count: 2, spread: 0.2 },
  // psychic
  psybeam:      { name: 'Psybeam', type: 'psychic', kind: 'beam', power: 210, cd: 4, charge: 0.35, dur: 0.5, width: 9, len: 270, slow: 2 },
  mindOrbs:     { name: 'Mind Orbs', type: 'psychic', kind: 'projectile', power: 120, cd: 2.4, speed: 165, r: 5, count: 2, spread: 0.7, homing: 2.6 },
  foresight:    { name: 'Foresight', type: 'psychic', kind: 'zone', power: 300, cd: 8, r: 30, delay: 1.6 },
  calmMind:     { name: 'Calm Mind', type: 'psychic', kind: 'buff', buff: { atk: 1.3, def: 1.3 }, dur: 8, cd: 15 },
  // dark
  nightSlash:   { name: 'Night Slash', type: 'dark', kind: 'dash', power: 175, cd: 2.2, speed: 370, dur: 0.25, crit: 0.3 },
  darkWave:     { name: 'Dark Wave', type: 'dark', kind: 'burst', power: 195, cd: 4.5, r: 56, delay: 0.4 },
  gloomOrb:     { name: 'Gloom Orb', type: 'dark', kind: 'projectile', power: 180, cd: 3, speed: 185, r: 7 },
  // fighting
  closeCombat:  { name: 'Close Combat', type: 'fighting', kind: 'dash', power: 320, cd: 5.5, speed: 320, dur: 0.38, selfDebuff: { def: 0.75 } },
  jab:          { name: 'Rapid Jab', type: 'fighting', kind: 'dash', power: 90, cd: 1.4, speed: 420, dur: 0.18 },
  auraSphere:   { name: 'Aura Sphere', type: 'fighting', kind: 'projectile', power: 170, cd: 2.8, speed: 200, r: 6, homing: 3.5 },
  bulkUp:       { name: 'Bulk Up', type: 'fighting', kind: 'buff', buff: { atk: 1.3, def: 1.3 }, dur: 8, cd: 15 },
  cottonGuard:  { name: 'Cotton Guard', type: 'grass', kind: 'buff', buff: { def: 1.8 }, dur: 7, cd: 15 },
};

const ITEMS = {
  voltCharm:   { name: 'VOLT CHARM', boostType: 'electric', mul: 1.2 },
  emberStone:  { name: 'EMBER STONE', boostType: 'fire', mul: 1.2 },
  mysticDrop:  { name: 'MYSTIC DROP', boostType: 'water', mul: 1.2 },
  snackPouch:  { name: 'SNACK POUCH', regen: 0.012 },
  swiftFeather:{ name: 'SWIFT FEATHER', spd: 1.12 },
  ironPlate:   { name: 'IRON PLATE', def: 1.12 },
  quickCharm:  { name: 'QUICK CHARM', cd: 0.88 },
  powerBand:   { name: 'POWER BAND', atk: 1.12 },
};

// size: M (32px sprite) or L (44px sprite). spd is movement in px/sec.
const ROSTER = [
  { id: 'sparkit',   name: 'SPARKIT',   types: ['electric'], hp: 820,  atk: 1.2,  def: 0.85, spd: 105, size: 'M', item: 'voltCharm',
    moves: ['voltRush', 'thunderbolt', 'thunder', 'quickHit'] },
  { id: 'cinderox',  name: 'CINDEROX',  types: ['fire'],     hp: 1080, atk: 1.12, def: 1.0,  spd: 90,  size: 'M', item: 'emberStone',
    moves: ['flameWheel', 'ember', 'fireBlast', 'eruption'] },
  { id: 'tidalisk',  name: 'TIDALISK',  types: ['water'],    hp: 1150, atk: 1.0,  def: 1.1,  spd: 86,  size: 'M', item: 'mysticDrop',
    moves: ['hydroCannon', 'bubbleBeam', 'aquaJet', 'whirlpool'] },
  { id: 'thornback', name: 'THORNBACK', types: ['grass', 'ground'], hp: 1260, atk: 0.98, def: 1.25, spd: 70, size: 'M', item: 'ironPlate',
    moves: ['razorLeaf', 'leafStorm', 'seedBomb', 'photosynth'] },
  { id: 'slumbear',  name: 'SLUMBEAR',  types: ['normal'],   hp: 1950, atk: 1.15, def: 1.15, spd: 55,  size: 'L', item: 'snackPouch',
    moves: ['megaBeam', 'bodySlam', 'heavyStomp', 'snack'] },
  { id: 'frostling', name: 'FROSTLING', types: ['ice'],      hp: 960,  atk: 1.1,  def: 0.92, spd: 96,  size: 'M', item: 'quickCharm',
    moves: ['iceShard', 'frostRay', 'blizzard', 'frostArmor'] },
  { id: 'drakorn',   name: 'DRAKORN',   types: ['dragon'],   hp: 1200, atk: 1.2,  def: 1.0,  spd: 88,  size: 'M', item: 'powerBand',
    moves: ['dragonPulse', 'dragonClaw', 'starfall', 'dragonDance'] },
  { id: 'boulderon', name: 'BOULDERON', types: ['rock', 'ground'], hp: 1420, atk: 1.15, def: 1.38, spd: 55, size: 'L', item: 'ironPlate',
    moves: ['rockSlide', 'stoneEdge', 'rollout', 'quake'] },
  { id: 'mindra',    name: 'MINDRA',    types: ['psychic'],  hp: 900,  atk: 1.22, def: 0.86, spd: 92,  size: 'M', item: 'quickCharm',
    moves: ['psybeam', 'mindOrbs', 'foresight', 'calmMind'] },
  { id: 'shadefang', name: 'SHADEFANG', types: ['dark'],     hp: 980,  atk: 1.2,  def: 0.9,  spd: 108, size: 'M', item: 'swiftFeather',
    moves: ['nightSlash', 'darkWave', 'gloomOrb', 'quickHit'] },
  { id: 'lumawool',  name: 'LUMAWOOL',  types: ['electric'], hp: 1080, atk: 1.06, def: 1.1,  spd: 76,  size: 'M', item: 'snackPouch',
    moves: ['thunderbolt', 'discharge', 'gemShot', 'cottonGuard'] },
  { id: 'brawlix',   name: 'BRAWLIX',   types: ['fighting'], hp: 1100, atk: 1.25, def: 1.0,  spd: 95,  size: 'M', item: 'powerBand',
    moves: ['closeCombat', 'jab', 'auraSphere', 'bulkUp'] },
];

const ROSTER_BY_ID = Object.fromEntries(ROSTER.map(m => [m.id, m]));

const DIFFICULTY = {
  easy:   { think: 0.38, dodge: 0.25, aggro: 0.45, react: 0.55, aimErr: 0.28, lead: false, swap: 0 },
  normal: { think: 0.22, dodge: 0.55, aggro: 0.7,  react: 0.3,  aimErr: 0.1,  lead: false, swap: 1 },
  hard:   { think: 0.12, dodge: 0.85, aggro: 0.92, react: 0.12, aimErr: 0.0,  lead: true, swap: 1.5 },
};

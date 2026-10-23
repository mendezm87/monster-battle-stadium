// App bootstrap: menus, team select, game loop.

// Shown on the title screen so players can tell whether their browser has the latest
// build (GitHub Pages lets browsers cache files for up to 10 minutes). Bump on every release.
const VERSION = '2026.10.23-r96';

// the legends tier (data.js LEGENDS) on the team screen: off by default, remembered in this browser
const LEGENDS_KEY = 'mbs.legends.v1';
let legendsOn = false;
try { legendsOn = localStorage.getItem(LEGENDS_KEY) === '1'; } catch (e) { /* storage blocked */ }
const isLegend = id => LEGENDS.some(m => m.id === id);
// who can be picked (and who the CPU and Random pick from)
const pickable = () => (legendsOn ? ALL_MONS() : ROSTER);
const App = {
  mode: '1p',       // '1p' vs the CPU, or '2p' local
  picking: 0,       // which player is choosing a team (2P)
  diff: 'normal',
  stage: 'summit',
  team: [],
  team2: [],
  enemyTeam: [],
  battle: null,
  paused: false,
};

const canvas = $('#view');
const ctx = canvas.getContext('2d');

// Crisp at any screen size: draw at the smallest even RES at least as big as the real screen
// pixels, and let the browser smoothly shrink it to fit. Capped at 6 so big screens stay fast.
function fitScreen() {
  const px = $('#game').getBoundingClientRect().width * (window.devicePixelRatio || 1);
  const res = Math.min(6, Math.max(2, Math.ceil(px / W / 2 - 0.02) * 2));
  if (res !== RES) { RES = res; canvas.width = W * RES; canvas.height = H * RES; }
}
fitScreen();
window.addEventListener('resize', fitScreen);
if (window.ResizeObserver) new ResizeObserver(fitScreen).observe($('#game'));
buildSprites();

// ---------- menu backdrop: the stage with weather and a few idle monsters ----------
const Backdrop = {
  init() {
    this.stage = buildStage('summit', 12345);
    this.flakes = Array.from({ length: 80 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 14 + Math.random() * 20, s: Math.random() < 0.25 ? 2 : 1 }));
    this.mons = ['slumbear', 'sparkit', 'smugshi', 'cinderox'].map((id, i) => ({ id, x: 44 + i * 66, y: 440 + (i % 2) * 18, face: i % 2 ? -1 : 1 }));
  },
  render(dt, t) {
    ctx.setTransform(RES, 0, 0, RES, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.stage.canvas, 0, 0);
    for (const m of this.mons) {
      const sp = SPRITES[m.id];
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath(); ctx.ellipse(m.x, m.y, sp.size / 2, sp.size / 6, 0, 0, Math.PI * 2); ctx.fill();
      const bob = Math.sin(t * 3 + m.x) > 0.6 ? -1 : 0;
      const S = sp.size * 1.5;
      ctx.save(); ctx.translate(Math.round(m.x), Math.round(m.y + bob)); if (m.face < 0) ctx.scale(-1, 1);
      ctx.drawImage(sp.img, -S / 2, -S + 3, S, S); ctx.restore();
    }
    ctx.fillStyle = '#fff';
    for (const f of this.flakes) {
      f.y += f.v * dt; f.x += Math.sin(t + f.y * 0.05) * 6 * dt;
      if (f.y > H) { f.y = -2; f.x = Math.random() * W; }
      ctx.fillRect(Math.round(f.x), Math.round(f.y), f.s, f.s);
    }
  },
};
Backdrop.init();

// ---------- title ----------
function bindSeg(id, key) {
  $(id).addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    Sfx.init(); Sfx.play('select');
    $(id).querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    App[key] = b.dataset.v;
  });
}
bindSeg('#opt-diff', 'diff');
bindSeg('#opt-mode', 'mode');
$('#opt-mode').addEventListener('click', () => $('#grp-diff').classList.toggle('off', App.mode !== '1p'));
bindSeg('#opt-stage', 'stage');

$('#btn-play').onclick = () => {
  Sfx.init(); Sfx.play('select'); App.picking = 0;
  if (App.mode === 'online') openOnline(); else openTeamSelect();
};
$('#btn-help').onclick = () => { Sfx.init(); Sfx.play('select'); UI.show('help'); };
$('#btn-help-back').onclick = () => { Sfx.play('back'); UI.show('title'); };
const muteBtn = $('#btn-mute');
function toggleMute() { Sfx.init(); const m = Sfx.toggle(); muteBtn.textContent = 'Sound: ' + (m ? 'Off' : 'On'); }
muteBtn.onclick = toggleMute;
Input.onMute = toggleMute;

// ---------- online lobby ----------
// Both players pick a team on their own screen; the host starts the battle once
// both teams are in. Messages: team, start, rematch, newteam (plus net.js's own).
const Online = { myTeam: null, peerTeam: null, stage: null };
const onlineStatus = (text, cls = '') => { const s = $('#online-status'); s.textContent = text; s.className = cls; };

function openOnline(msg = '') {
  $('#online-code').classList.add('hidden');
  $('#online-actions').classList.remove('hidden');
  onlineStatus(msg, msg ? 'err' : '');
  UI.show('online');
}

$('#btn-host').onclick = async () => {
  Sfx.play('select');
  $('#online-actions').classList.add('hidden');
  onlineStatus('Opening a room...');
  try {
    const code = await Net.host();
    $('#online-code').textContent = code;
    $('#online-code').classList.remove('hidden');
    onlineStatus('Share this code with your opponent. Waiting for them to join...');
  } catch (e) { openOnline(e.message); }
};
$('#btn-join').onclick = async () => {
  const code = $('#join-code').value.trim().toUpperCase();
  if (code.length !== 5) { onlineStatus('Enter the 5-letter code from the host.', 'err'); return; }
  Sfx.play('select');
  $('#online-actions').classList.add('hidden');
  onlineStatus('Connecting...');
  try { await Net.join(code); } catch (e) { openOnline(e.message); }
};
$('#join-code').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') $('#btn-join').click(); });
$('#btn-online-back').onclick = () => { Sfx.play('back'); Net.leave(); UI.show('title'); };

Net.onConnected = () => {
  Sfx.play('ball');
  Online.myTeam = Online.peerTeam = null;
  App.picking = 0;
  openTeamSelect();
};
Net.onClosed = reason => {
  if (App.battle) leaveBattle(null);
  openOnline(reason);
};
Net.onMessage = d => {
  const b = App.battle;
  switch (d.t) {
    case 'team':     // host gets the guest's team
      Online.peerTeam = d.ids;
      maybeStartOnline();
      break;
    case 'start':    // guest: the host has started the battle
      startBattle({ ...d });
      break;
    case 'swap':     // host: the guest wants to swap (-1 = next healthy teammate)
      if (!b) break;
      if (d.i < 0) cycleSwap('enemy'); else if (b.swap('enemy', d.i)) Sfx.play('ball');
      break;
    case 'pause':    // host: the guest pressed pause
      togglePause();
      break;
    case 'paused':   // guest: the host paused or resumed
      setPaused(d.on);
      break;
    case 'pick':     // guest: our monster fainted, choose the next one
      if (b) UI.pickNext(b.e, i => Net.send({ t: 'picked', i }), null);
      break;
    case 'wait':
      UI.banner('OPPONENT IS CHOOSING');
      break;
    case 'end':      // guest: the battle is over (result already from our side)
      Sfx.music.stop(0.6);
      setTimeout(() => Sfx.play(d.r.result === 'win' ? 'win' : 'lose'), 500);
      if (b) b.state = 'over';
      UI.onEnd(d.r);
      break;
    case 'rematch':  // host: the guest asked for a rematch
      if (Net.role === 'host') startOnlineBattle();
      break;
    case 'newteam':  // either side went back to team select
      Online.myTeam = Online.peerTeam = null;
      if (App.battle) leaveBattle('team'); else openTeamSelect();
      break;
  }
};

function maybeStartOnline() {
  if (Net.role === 'host' && Online.myTeam && Online.peerTeam) startOnlineBattle();
}
function startOnlineBattle() {
  const stages = Object.keys(STAGES);
  const stage = App.stage === 'random' ? stages[(Math.random() * stages.length) | 0] : App.stage;
  const cfg = { t: 'start', p: Online.myTeam, e: Online.peerTeam, stage, seed: (Math.random() * 1e9) | 0 };
  Net.send(cfg);
  startBattle(cfg);
}

// ---------- team select ----------
let detailId = null;
let editSlot = -1;   // which move slot is being swapped on the team screen (-1 = none)
const twoP = () => App.mode === '2p';
const online = () => App.mode === 'online' && Net.active;
// a tabletop game is 2 players sharing one touch screen
const tabletop = () => twoP() && !document.body.classList.contains('no-touch');
const curTeam = () => (App.picking === 1 ? App.team2 : App.team);

function openTeamSelect() {
  const roster = $('#roster');
  if (!roster.children.length) {
    for (const m of ALL_MONS()) {
      const card = document.createElement('div');
      card.className = 'card' + (isLegend(m.id) ? ' legend' : ''); card.dataset.id = m.id;
      const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
      drawPortrait(cv, m.id);
      card.appendChild(cv);
      card.insertAdjacentHTML('beforeend', `<div class="order"></div><div class="c-name">${m.name}</div><div class="c-types">${m.types.map(t => UI.typeTag(t)).join('')}</div>`);
      card.onclick = () => toggleTeam(m.id);
      roster.appendChild(card);
    }
  }
  detailId = null;
  refreshTeam();
  $('#screen-team').classList.toggle('flip', tabletop() && App.picking === 1);
  UI.show('team');
}

function toggleTeam(id) {
  if (online() && Online.myTeam) return;   // already locked in
  Sfx.play('select');
  const team = curTeam();
  const i = team.indexOf(id);
  if (i >= 0) team.splice(i, 1);
  else if (team.length < 6) team.push(id);
  if (detailId !== id) editSlot = -1;
  detailId = id;
  refreshTeam();
}

function refreshTeam() {
  document.querySelectorAll('#roster .card').forEach(c => {
    const i = curTeam().indexOf(c.dataset.id);
    c.classList.toggle('sel', i >= 0);
    c.classList.toggle('hidden', isLegend(c.dataset.id) && !legendsOn);
    c.querySelector('.order').textContent = i >= 0 ? i + 1 : '';
  });
  const team = curTeam();
  const waiting = online() && Online.myTeam;
  $('#team-title').textContent = twoP() ? `Player ${App.picking + 1}: pick your team` : 'Pick your team';
  $('#team-count').textContent = `${team.length}/6`;
  $('#btn-team-legends').textContent = `Legends: ${legendsOn ? 'On' : 'Off'}`;
  $('#btn-team-go').disabled = team.length === 0 || waiting;
  $('#btn-team-go').textContent = twoP() && App.picking === 0 ? 'NEXT' : waiting ? 'READY' : 'FIGHT!';
  const d = $('#team-detail');
  if (!detailId || waiting) {
    d.innerHTML = waiting
      ? `<div class="hint">Team locked in. Waiting for your opponent to pick theirs...</div>`
      : twoP()
        ? `<div class="hint">Player ${App.picking + 1}, tap monsters to add them to your team (up to 6). Both players may pick the same monsters.</div>`
        : online()
          ? `<div class="hint">Connected! Tap monsters to add them to your team (up to 6). Your opponent picks theirs at the same time.</div>`
          : `<div class="hint">Tap monsters to add them to your team (up to 6). The CPU fields a team of the same size.</div>`;
    return;
  }
  const m = ROSTER_BY_ID[detailId], p = App.picking, cur = MoveSets.get(p, m.id);
  const mvBtn = (k, attrs, cls = '') => `<button class="d-move ${cls}" ${attrs} data-tip="mv:${k}" style="background:${TYPES[MOVES[k].type].color}">${MOVES[k].name}<small>${KIND_NAMES[MOVES[k].kind]}${MOVES[k].power ? ' · ' + MOVES[k].power : ''}</small></button>`;
  let pool = '';
  if (editSlot >= 0) {
    pool = `<div class="d-pool-title">Swap <b>${MOVES[cur[editSlot]].name}</b> for:</div><div class="d-pool">${movePool(m.id).filter(k => k !== cur[editSlot]).map(k => mvBtn(k, `data-mv="${k}"`, cur.includes(k) ? 'used' : '')).join('')}</div>`;
  }
  d.innerHTML = `<canvas width="88" height="88"></canvas><div class="d-body">
    <div class="d-name">${m.name} ${m.types.map(t => UI.typeTag(t)).join(' ')}</div>
    <div class="d-stats">HP ${m.hp} · ATK ${Math.round(m.atk * 100)} · DEF ${Math.round(m.def * 100)} · SPD ${m.spd} · <span class="tipped" data-tip="item:${m.item}">${ITEMS[m.item].name}</span></div>
    <div class="d-moves">${cur.map((k, i) => mvBtn(k, `data-slot="${i}"`, i === editSlot ? 'sel' : '')).join('')}</div>
    ${editSlot >= 0 ? `<div class="d-mvdesc"><b>${MOVES[cur[editSlot]].name}</b> <span>${moveStats(MOVES[cur[editSlot]])}</span><br>${moveDesc(MOVES[cur[editSlot]])}</div>` : ''}
    <div class="d-tip">${editSlot >= 0 ? 'Pick a move to put in that slot (a dimmed one trades places).' : 'Tap a move to swap it for another one ' + m.name + ' can learn.'}${MoveSets.isDefault(p, m.id) ? '' : ' <button class="d-reset">Default moves</button>'}</div>
    ${pool}</div>`;
  drawPortrait(d.querySelector('canvas'), m.id);
}
// Swapping moves (movesets.js): tap a move to pick its slot, then a move from the pool.
$('#team-detail').addEventListener('click', e => {
  const b = e.target.closest('button'), p = App.picking;
  if (!b || !detailId || (online() && Online.myTeam)) return;
  if (b.dataset.slot !== undefined) { const s = +b.dataset.slot; editSlot = editSlot === s ? -1 : s; Sfx.play('select'); }
  else if (b.dataset.mv) { if (MoveSets.set(p, detailId, editSlot, b.dataset.mv)) { Sfx.play('buff'); editSlot = -1; } else { Sfx.play('back'); UI.banner('NEEDS AN ATTACK'); } }
  else if (b.classList.contains('d-reset')) { MoveSets.reset(p, detailId); editSlot = -1; Sfx.play('back'); }
  refreshTeam();
});

$('#btn-team-back').onclick = () => {
  Sfx.play('back');
  if (App.picking === 1) { App.picking = 0; openTeamSelect(); return; }
  if (App.mode === 'online') { Net.leave(); openOnline(); return; }
  UI.show('title');
};
// Legends on/off: the evolved starters and Garrishell's altar forms (much stronger, so off by default)
$('#btn-team-legends').onclick = () => {
  if (online() && Online.myTeam) return;
  legendsOn = !legendsOn;
  try { localStorage.setItem(LEGENDS_KEY, legendsOn ? '1' : '0'); } catch (e) { /* ignore */ }
  Sfx.play(legendsOn ? 'buff' : 'back');
  if (!legendsOn) for (const t of [App.team, App.team2]) for (let i = t.length - 1; i >= 0; i--) if (isLegend(t[i])) t.splice(i, 1);
  if (detailId && isLegend(detailId) && !legendsOn) detailId = null;
  refreshTeam();
};
$('#btn-team-random').onclick = () => {
  if (online() && Online.myTeam) return;
  Sfx.play('select');
  const team = curTeam();
  team.splice(0, team.length, ...shuffle(pickable().map(m => m.id)).slice(0, 6));
  detailId = team[0];
  refreshTeam();
};
$('#btn-team-go').onclick = () => {
  Sfx.play('select');
  if (online()) {
    Online.myTeam = MoveSets.team(0, App.team);   // ids with their move sets
    if (Net.role === 'guest') Net.send({ t: 'team', ids: Online.myTeam });
    refreshTeam();
    maybeStartOnline();
    return;
  }
  if (twoP() && App.picking === 0) { App.picking = 1; openTeamSelect(); return; }
  App.enemyTeam = twoP() ? App.team2.slice() : shuffle(pickable().map(m => m.id)).slice(0, App.team.length);
  startBattle();
};

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ---------- battle ----------
Input.bindStick($('#stick-zone'), $('#stick'), $('#knob'), 0);
Input.bindStick($('#stick-zone2'), $('#stick2'), $('#knob2'), 1, true);

// net: null for a local game, or the host's start message for an online one
function startBattle(net = null) {
  const stages = Object.keys(STAGES);
  const stage = App.stage === 'random' ? stages[(Math.random() * stages.length) | 0] : App.stage;
  const guest = !!net && Net.role === 'guest';
  UI.hideScreens();
  UI.twoP = twoP(); UI.tabletop = tabletop();
  UI.mySide = guest ? 'enemy' : 'player';
  UI.onSwapPick = guest ? i => Net.send({ t: 'swap', i }) : null;
  document.body.classList.toggle('two-p', UI.twoP);
  document.body.classList.toggle('tabletop', UI.tabletop);
  Input.setMode(UI.twoP ? 'duo' : 'solo');
  Input.mouse = !UI.twoP;   // mouse attacks in 1-player and online games
  UI.setBattleChrome(true);
  UI.hudCache = {};
  UI.closeSwap();
  Input.reset();
  App.paused = false;
  let opts = { playerTeam: MoveSets.team(0, App.team), enemyTeam: twoP() ? MoveSets.team(1, App.enemyTeam) : App.enemyTeam.slice(), difficulty: App.diff, stage, ui: UI,
    twoP: UI.twoP, overheadBars: UI.tabletop };
  if (net) opts = { ...opts, ...Net.battleOptions(net) };
  Sfx.init(); Sfx.resume(); Sfx.music.start(STAGE_SONGS[opts.stage] || 'rush');
  App.battle = new Battle(opts);
  if (net) Net.attach(App.battle);
  UI.buildMoveButtons(UI.own(App.battle).mon, 0);
  if (UI.twoP) UI.buildMoveButtons(App.battle.E, 1);
}

// to: 'team', 'title' or null (the caller shows the next screen)
function leaveBattle(to) {
  App.battle = null; App.paused = false;
  Sfx.resume(); Sfx.music.stop();
  UI.setBattleChrome(false);
  UI.mySide = 'player'; UI.onSwapPick = null;
  document.body.classList.remove('two-p', 'tabletop');
  Input.setMode('solo');
  Input.mouse = false;
  App.picking = 0;
  if (to === 'team') openTeamSelect(); else if (to === 'title') UI.show('title');
}

function setPaused(on) {
  App.paused = on;
  Input.reset();
  if (on) { UI.show('pause'); Sfx.pause(); } else { UI.hideScreens(); Sfx.resume(); }
}

// Online, the host owns the pause: the guest asks, the host flips it for both.
function togglePause() {
  const b = App.battle;
  if (!b || b.state === 'over' || b.state === 'pick') return;
  if (b.puppet) { Net.send({ t: 'pause' }); return; }
  setPaused(!App.paused);
  if (b.online) Net.send({ t: 'paused', on: App.paused });
}
Input.onPause = togglePause;

// Swap key / bumper / player 2's SWAP button: instant swap to the next healthy teammate (no pause)
function cycleSwap(side) {
  const b = App.battle;
  if (!b || App.paused || (side === 'enemy' && !b.twoP)) return;
  if (b.puppet) { Net.send({ t: 'swap', i: -1 }); return; }
  const team = side === 'player' ? b.p : b.e, cur = side === 'player' ? b.pi : b.ei;
  for (let k = 1; k < team.length; k++) {
    const i = (cur + k) % team.length;
    if (b.canSwap(side, i)) { b.swap(side, i); Sfx.play('ball'); return; }
  }
}
Input.onSwap = p => cycleSwap(p === 0 ? 'player' : 'enemy');
$('#btn-swap').addEventListener('pointerdown', e => { e.preventDefault(); UI.toggleSwap(App.battle); });
$('#btn-swap2').addEventListener('pointerdown', e => { e.preventDefault(); cycleSwap('enemy'); });
$('#btn-pause').onclick = togglePause;
$('#btn-resume').onclick = togglePause;
$('#btn-quit').onclick = () => { Sfx.play('back'); if (Net.active) Net.leave(); leaveBattle('title'); };
$('#btn-rematch').onclick = () => {
  Sfx.play('select');
  if (!App.battle || !App.battle.online) { startBattle(); return; }
  if (Net.role === 'host') startOnlineBattle(); else Net.send({ t: 'rematch' });
};
$('#btn-newteam').onclick = () => {
  Sfx.play('select');
  if (App.battle && App.battle.online) { Online.myTeam = Online.peerTeam = null; Net.send({ t: 'newteam' }); }
  leaveBattle('team');
};
$('#btn-title').onclick = () => { Sfx.play('back'); if (Net.active) Net.leave(); leaveBattle('title'); };
document.addEventListener('visibilitychange', () => { if (document.hidden && App.battle && !App.paused && !App.battle.puppet) togglePause(); });

// ---------- loop ----------
let last = performance.now(), clockT = 0;
function frame(now) {
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
  last = now; clockT += dt;
  Input.poll();
  const b = App.battle;
  if (b) {
    if (b.puppet) Net.guestFrame(dt, App.paused);
    else {
      if (!App.paused && b.state !== 'pick') b.update(dt);
      if (b.online) Net.hostTick(dt);
    }
    b.render(ctx);
    UI.updateHud(b);
  } else {
    Backdrop.render(dt, clockT);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
$('#version').textContent = 'version ' + VERSION;
UI.show('title');

// Debug / testing hook
window.__MBS = App;

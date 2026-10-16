// App bootstrap: menus, team select, game loop.

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
buildSprites();

// ---------- menu backdrop: the stage with weather and a few idle monsters ----------
const Backdrop = {
  init() {
    this.stage = buildStage('summit', 12345);
    this.flakes = Array.from({ length: 80 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 14 + Math.random() * 20, s: Math.random() < 0.25 ? 2 : 1 }));
    this.mons = ['slumbear', 'sparkit', 'drakorn', 'cinderox'].map((id, i) => ({ id, x: 44 + i * 66, y: 440 + (i % 2) * 18, face: i % 2 ? -1 : 1 }));
  },
  render(dt, t) {
    ctx.setTransform(2, 0, 0, 2, 0, 0);
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
$('#opt-mode').addEventListener('click', () => $('#grp-diff').classList.toggle('off', App.mode === '2p'));
bindSeg('#opt-stage', 'stage');

$('#btn-play').onclick = () => { Sfx.init(); Sfx.play('select'); App.picking = 0; openTeamSelect(); };
$('#btn-help').onclick = () => { Sfx.init(); Sfx.play('select'); UI.show('help'); };
$('#btn-help-back').onclick = () => { Sfx.play('back'); UI.show('title'); };
const muteBtn = $('#btn-mute');
function toggleMute() { Sfx.init(); const m = Sfx.toggle(); muteBtn.textContent = 'Sound: ' + (m ? 'Off' : 'On'); }
muteBtn.onclick = toggleMute;
Input.onMute = toggleMute;

// ---------- team select ----------
let detailId = null;
const twoP = () => App.mode === '2p';
// a tabletop game is 2 players sharing one touch screen
const tabletop = () => twoP() && !document.body.classList.contains('no-touch');
const curTeam = () => (App.picking === 1 ? App.team2 : App.team);

function openTeamSelect() {
  const roster = $('#roster');
  if (!roster.children.length) {
    for (const m of ROSTER) {
      const card = document.createElement('div');
      card.className = 'card'; card.dataset.id = m.id;
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
  Sfx.play('select');
  const team = curTeam();
  const i = team.indexOf(id);
  if (i >= 0) team.splice(i, 1);
  else if (team.length < 6) team.push(id);
  detailId = id;
  refreshTeam();
}

function refreshTeam() {
  document.querySelectorAll('#roster .card').forEach(c => {
    const i = curTeam().indexOf(c.dataset.id);
    c.classList.toggle('sel', i >= 0);
    c.querySelector('.order').textContent = i >= 0 ? i + 1 : '';
  });
  const team = curTeam();
  $('#team-title').textContent = twoP() ? `Player ${App.picking + 1}: pick your team` : 'Pick your team';
  $('#team-count').textContent = `${team.length}/6`;
  $('#btn-team-go').disabled = team.length === 0;
  $('#btn-team-go').textContent = twoP() && App.picking === 0 ? 'NEXT' : 'FIGHT!';
  const d = $('#team-detail');
  if (!detailId) {
    d.innerHTML = twoP()
      ? `<div class="hint">Player ${App.picking + 1}, tap monsters to add them to your team (up to 6). Both players may pick the same monsters.</div>`
      : `<div class="hint">Tap monsters to add them to your team (up to 6). The CPU fields a team of the same size.</div>`;
    return;
  }
  const m = ROSTER_BY_ID[detailId];
  d.innerHTML = `<canvas width="88" height="88"></canvas><div>
    <div class="d-name">${m.name} ${m.types.map(t => UI.typeTag(t)).join(' ')}</div>
    <div class="d-stats">HP ${m.hp} · ATK ${Math.round(m.atk * 100)} · DEF ${Math.round(m.def * 100)} · SPD ${m.spd} · ${ITEMS[m.item].name}</div>
    <div class="d-moves">${m.moves.map(k => `<div class="d-move" style="background:${TYPES[MOVES[k].type].color}">${MOVES[k].name}</div>`).join('')}</div></div>`;
  drawPortrait(d.querySelector('canvas'), m.id);
}

$('#btn-team-back').onclick = () => {
  Sfx.play('back');
  if (App.picking === 1) { App.picking = 0; openTeamSelect(); return; }
  UI.show('title');
};
$('#btn-team-random').onclick = () => {
  Sfx.play('select');
  const team = curTeam();
  team.splice(0, team.length, ...shuffle(ROSTER.map(m => m.id)).slice(0, 6));
  detailId = team[0];
  refreshTeam();
};
$('#btn-team-go').onclick = () => {
  Sfx.play('select');
  if (twoP() && App.picking === 0) { App.picking = 1; openTeamSelect(); return; }
  App.enemyTeam = twoP() ? App.team2.slice() : shuffle(ROSTER.map(m => m.id)).slice(0, App.team.length);
  startBattle();
};

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ---------- battle ----------
Input.bindStick($('#stick-zone'), $('#stick'), $('#knob'), 0);
Input.bindStick($('#stick-zone2'), $('#stick2'), $('#knob2'), 1, true);

function startBattle() {
  const stages = Object.keys(STAGES);
  const stage = App.stage === 'random' ? stages[(Math.random() * stages.length) | 0] : App.stage;
  UI.hideScreens();
  UI.twoP = twoP(); UI.tabletop = tabletop();
  document.body.classList.toggle('two-p', UI.twoP);
  document.body.classList.toggle('tabletop', UI.tabletop);
  Input.setMode(UI.twoP ? 'duo' : 'solo');
  UI.setBattleChrome(true);
  UI.hudCache = {};
  UI.closeSwap();
  Input.reset();
  Sfx.init(); Sfx.resume(); Sfx.music.start();
  App.paused = false;
  App.battle = new Battle({ playerTeam: App.team.slice(), enemyTeam: App.enemyTeam.slice(), difficulty: App.diff, stage, ui: UI,
    twoP: UI.twoP, overheadBars: UI.tabletop });
  UI.buildMoveButtons(App.battle.P, 0);
  if (UI.twoP) UI.buildMoveButtons(App.battle.E, 1);
}

function leaveBattle(to) {
  App.battle = null; App.paused = false;
  Sfx.resume(); Sfx.music.stop();
  UI.setBattleChrome(false);
  document.body.classList.remove('two-p', 'tabletop');
  Input.setMode('solo');
  App.picking = 0;
  if (to === 'team') openTeamSelect(); else UI.show('title');
}

function togglePause() {
  const b = App.battle;
  if (!b || b.state === 'over' || b.state === 'pick') return;
  App.paused = !App.paused;
  Input.reset();
  if (App.paused) { UI.show('pause'); Sfx.pause(); } else { UI.hideScreens(); Sfx.resume(); }
}
Input.onPause = togglePause;

// Swap key / bumper / player 2's SWAP button: instant swap to the next healthy teammate (no pause)
function cycleSwap(side) {
  const b = App.battle;
  if (!b || App.paused || (side === 'enemy' && !b.twoP)) return;
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
$('#btn-quit').onclick = () => { Sfx.play('back'); leaveBattle('title'); };
$('#btn-rematch').onclick = () => { Sfx.play('select'); startBattle(); };
$('#btn-newteam').onclick = () => { Sfx.play('select'); leaveBattle('team'); };
$('#btn-title').onclick = () => { Sfx.play('back'); leaveBattle('title'); };
document.addEventListener('visibilitychange', () => { if (document.hidden && App.battle && !App.paused) togglePause(); });

// ---------- loop ----------
let last = performance.now(), clockT = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now; clockT += dt;
  Input.poll();
  const b = App.battle;
  if (b) {
    if (!App.paused && b.state !== 'pick') b.update(dt);
    b.render(ctx);
    UI.updateHud(b);
  } else {
    Backdrop.render(dt, clockT);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
UI.show('title');

// Debug / testing hook
window.__MBS = App;

// App bootstrap: menus, team select, game loop.

const App = {
  diff: 'normal',
  stage: 'summit',
  team: [],
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
bindSeg('#opt-stage', 'stage');

$('#btn-play').onclick = () => { Sfx.init(); Sfx.play('select'); openTeamSelect(); };
$('#btn-help').onclick = () => { Sfx.init(); Sfx.play('select'); UI.show('help'); };
$('#btn-help-back').onclick = () => { Sfx.play('back'); UI.show('title'); };
const muteBtn = $('#btn-mute');
function toggleMute() { Sfx.init(); const m = Sfx.toggle(); muteBtn.textContent = 'Sound: ' + (m ? 'Off' : 'On'); }
muteBtn.onclick = toggleMute;
Input.onMute = toggleMute;

// ---------- team select ----------
let detailId = null;
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
  refreshTeam();
  UI.show('team');
}

function toggleTeam(id) {
  Sfx.play('select');
  const i = App.team.indexOf(id);
  if (i >= 0) App.team.splice(i, 1);
  else if (App.team.length < 6) App.team.push(id);
  detailId = id;
  refreshTeam();
}

function refreshTeam() {
  document.querySelectorAll('#roster .card').forEach(c => {
    const i = App.team.indexOf(c.dataset.id);
    c.classList.toggle('sel', i >= 0);
    c.querySelector('.order').textContent = i >= 0 ? i + 1 : '';
  });
  $('#team-count').textContent = `${App.team.length}/6`;
  $('#btn-team-go').disabled = App.team.length === 0;
  const d = $('#team-detail');
  if (!detailId) {
    d.innerHTML = `<div class="hint">Tap monsters to add them to your team (up to 6). The CPU fields a team of the same size.</div>`;
    return;
  }
  const m = ROSTER_BY_ID[detailId];
  d.innerHTML = `<canvas width="88" height="88"></canvas><div>
    <div class="d-name">${m.name} ${m.types.map(t => UI.typeTag(t)).join(' ')}</div>
    <div class="d-stats">HP ${m.hp} · ATK ${Math.round(m.atk * 100)} · DEF ${Math.round(m.def * 100)} · SPD ${m.spd} · ${ITEMS[m.item].name}</div>
    <div class="d-moves">${m.moves.map(k => `<div class="d-move" style="background:${TYPES[MOVES[k].type].color}">${MOVES[k].name}</div>`).join('')}</div></div>`;
  drawPortrait(d.querySelector('canvas'), m.id);
}

$('#btn-team-back').onclick = () => { Sfx.play('back'); UI.show('title'); };
$('#btn-team-random').onclick = () => {
  Sfx.play('select');
  App.team = shuffle(ROSTER.map(m => m.id)).slice(0, 6);
  detailId = App.team[0];
  refreshTeam();
};
$('#btn-team-go').onclick = () => {
  Sfx.play('select');
  App.enemyTeam = shuffle(ROSTER.map(m => m.id)).slice(0, App.team.length);
  startBattle();
};

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ---------- battle ----------
Input.bindStick($('#stick-zone'), $('#stick'), $('#knob'));

function startBattle() {
  const stages = Object.keys(STAGES);
  const stage = App.stage === 'random' ? stages[(Math.random() * stages.length) | 0] : App.stage;
  UI.hideScreens();
  UI.setBattleChrome(true);
  UI.hudCache = {};
  UI.closeSwap();
  Input.reset();
  Sfx.init(); Sfx.resume(); Sfx.music.start();
  App.paused = false;
  App.battle = new Battle({ playerTeam: App.team.slice(), enemyTeam: App.enemyTeam.slice(), difficulty: App.diff, stage, ui: UI });
  UI.buildMoveButtons(App.battle.P);
}

function leaveBattle(to) {
  App.battle = null; App.paused = false;
  Sfx.resume(); Sfx.music.stop();
  UI.setBattleChrome(false);
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

// Q / Tab: instant swap to the next healthy teammate (no pause)
Input.onSwap = () => {
  const b = App.battle;
  if (!b || App.paused) return;
  for (let k = 1; k < b.p.length; k++) {
    const i = (b.pi + k) % b.p.length;
    if (b.canSwap('player', i)) { b.swap('player', i); Sfx.play('ball'); return; }
  }
};
$('#btn-swap').addEventListener('pointerdown', e => { e.preventDefault(); UI.toggleSwap(App.battle); });
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

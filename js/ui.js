// DOM-side UI: screens, HUD, callouts, banners, move buttons.

const $ = sel => document.querySelector(sel);

const UI = {
  screens: ['title', 'help', 'team', 'pick', 'pause', 'result'],

  show(name) {
    for (const s of this.screens) $('#screen-' + s).classList.toggle('hidden', s !== name);
  },
  hideScreens() { for (const s of this.screens) $('#screen-' + s).classList.add('hidden'); },

  setBattleChrome(on) {
    $('#hud').classList.toggle('hidden', !on);
    $('#controls').classList.toggle('hidden', !on);
    if (!on) { $('#callouts').innerHTML = ''; $('#banner').className = ''; }
  },

  typeTag(t) { return `<span class="tag" style="background:${TYPES[t].color}">${TYPES[t].name}</span>`; },

  // ---------------- battle hooks (called by Battle) ----------------
  callout(side, name, type) {
    const el = document.createElement('div');
    el.className = 'callout ' + (side === 'player' ? 'left' : 'right');
    el.style.borderColor = TYPES[type].color;
    el.textContent = name + '!';
    const box = $('#callouts');
    [...box.querySelectorAll('.callout.' + (side === 'player' ? 'left' : 'right'))].forEach(n => n.remove());
    box.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  },

  banner(text) {
    const b = $('#banner');
    b.textContent = text;
    b.className = '';
    void b.offsetWidth; // restart animation
    b.className = 'show';
  },

  onSendOut(side, mon) {
    if (side === 'player') { this.buildMoveButtons(mon); this.closeSwap(); }
    this.hudCache = {};
  },

  // ---------------- swap tray (does not pause the fight) ----------------
  swapOpen: false,
  toggleSwap(battle) {
    if (this.swapOpen) { this.closeSwap(); return; }
    if (!battle || battle.state !== 'fight') return;
    const tray = $('#swap-tray');
    tray.innerHTML = '';
    this.swapChips = battle.p.map((m, i) => {
      if (i === battle.pi) return null;
      const chip = document.createElement('div');
      chip.className = 'swap-chip';
      const cv = document.createElement('canvas'); cv.width = 48; cv.height = 48;
      drawPortrait(cv, m.id, { fainted: m.fainted });
      chip.appendChild(cv);
      chip.insertAdjacentHTML('beforeend', '<div class="mini"><div></div></div>');
      chip.addEventListener('pointerdown', e => {
        e.preventDefault();
        if (battle.swap('player', i)) Sfx.play('ball');
        this.closeSwap();
      });
      tray.appendChild(chip);
      return { el: chip, bar: chip.querySelector('.mini div'), mon: m, i };
    }).filter(Boolean);
    this.swapOpen = true;
    tray.classList.remove('hidden');
    $('#btn-swap').classList.add('open');
    Sfx.play('select');
  },
  closeSwap() {
    this.swapOpen = false;
    $('#swap-tray').classList.add('hidden');
    $('#btn-swap').classList.remove('open');
  },

  pickNext(team, cb) {
    const list = $('#pick-list');
    list.innerHTML = '';
    team.forEach((m, i) => {
      const card = document.createElement('div');
      card.className = 'card' + (m.fainted ? ' done' : '');
      const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
      drawPortrait(cv, m.id, { fainted: m.fainted });
      card.appendChild(cv);
      card.insertAdjacentHTML('beforeend',
        `<div class="c-name">${m.def.name}</div><div class="c-types">${m.def.types.map(t => this.typeTag(t)).join('')}</div>
         <div class="c-hp">${m.fainted ? 'FAINTED' : `${Math.ceil(m.hp)} / ${m.maxHp} HP`}</div>`);
      if (!m.fainted) card.onclick = () => { Sfx.play('select'); this.hideScreens(); cb(i); };
      list.appendChild(card);
    });
    this.show('pick');
  },

  onEnd(r) {
    setTimeout(() => {
      const title = { win: 'VICTORY!', lose: 'DEFEAT', draw: 'DRAW' }[r.result];
      $('#result-title').textContent = title;
      const mm = Math.floor(r.time / 60), ss = String(Math.floor(r.time % 60)).padStart(2, '0');
      $('#result-stats').innerHTML = `Time ${mm}:${ss}<br>Knockouts ${r.kos} &nbsp;·&nbsp; Lost ${r.lost}<br>Damage dealt ${r.dealt}`;
      this.show('result');
    }, 1200);
  },

  // ---------------- HUD ----------------
  buildMoveButtons(mon) {
    const box = $('#move-buttons');
    box.innerHTML = '';
    const keys = ['J', 'K', 'L', ';'];
    this.moveBtns = mon.moves.map((mv, i) => {
      const b = document.createElement('div');
      b.className = 'mbtn';
      const col = TYPES[mv.type].color;
      b.style.background = `linear-gradient(${col}, ${shadeHex(col, -0.25)})`;
      b.innerHTML = `<span class="key">${keys[i]}</span><span class="nm">${mv.name}</span><div class="cd"></div>`;
      b.style.display = 'flex'; b.style.alignItems = 'center'; b.style.justifyContent = 'center';
      Input.bindMoveButton(b, i);
      box.appendChild(b);
      return { el: b, cd: b.querySelector('.cd') };
    });
  },

  hudCache: {},
  updateHud(battle) {
    this.updateSide('#hud-p', battle.P, battle.p, battle.pi, 'p');
    this.updateSide('#hud-e', battle.E, battle.e, battle.ei, 'e');
    const t = Math.floor(battle.clock);
    const ts = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
    if (this.hudCache.time !== ts) { $('#timer').textContent = ts; this.hudCache.time = ts; }
    const scd = Math.max(0, battle.swapCd.player);
    $('#btn-swap .cd').style.height = (scd / 8 * 100) + '%';
    if (this.swapOpen) {
      if (battle.state !== 'fight') this.closeSwap();
      else for (const c of this.swapChips) {
        const pct = c.mon.hp / c.mon.maxHp;
        c.bar.style.width = (pct * 100) + '%';
        c.bar.style.background = pct > 0.5 ? 'var(--hp-hi)' : pct > 0.2 ? 'var(--hp-mid)' : 'var(--hp-lo)';
        c.el.classList.toggle('off', !battle.canSwap('player', c.i));
      }
    }
    if (this.moveBtns) {
      const m = battle.P;
      this.moveBtns.forEach((b, i) => {
        const full = m.moves[i].cd * (m.item.cd || 1);
        b.cd.style.height = (m.cd[i] > 0 ? (m.cd[i] / full) * 100 : 0) + '%';
      });
    }
  },

  updateSide(sel, mon, team, idx, key) {
    const root = $(sel);
    const c = this.hudCache[key] || (this.hudCache[key] = { ghost: mon.hp });
    if (c.id !== mon.id + idx) {
      c.id = mon.id + idx; c.ghost = mon.hp;
      root.querySelector('.mon-name').textContent = mon.def.name;
      drawPortrait(root.querySelector('.portrait canvas'), mon.id, { zoom: 1.6, crop: true });
      const tc = root.querySelector('.trainer-icon canvas');
      const ctx = tc.getContext('2d'); ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, 24, 24);
      ctx.drawImage(trainerCanvas(key === 'p' ? 'player' : 'rival', false), 0, 0, 12, 12, 0, 0, 24, 24);
      c.tags = null;
    }
    const tags = mon.def.types.map(t => this.typeTag(t)).join('') +
      (mon.status ? `<span class="tag status ${mon.status}">${mon.status.toUpperCase()}</span>` : `<span class="tag item">${mon.item.name || ''}</span>`);
    if (c.tags !== tags) { root.querySelector('.tags').innerHTML = tags; c.tags = tags; }

    const pct = mon.hp / mon.maxHp;
    c.ghost = c.ghost > mon.hp ? Math.max(mon.hp, c.ghost - mon.maxHp * 0.6 / 60) : mon.hp;
    const fill = root.querySelector('.fill'), ghost = root.querySelector('.ghost');
    fill.style.width = (pct * 100) + '%';
    fill.style.background = pct > 0.5 ? 'var(--hp-hi)' : pct > 0.2 ? 'var(--hp-mid)' : 'var(--hp-lo)';
    ghost.style.width = (c.ghost / mon.maxHp * 100) + '%';
    const hpText = String(Math.ceil(mon.hp));
    if (c.hp !== hpText) { root.querySelector('.hpnum').textContent = hpText; c.hp = hpText; }

    const balls = team.map((m, i) => `<div class="ball${m.fainted ? ' out' : ''}${i === idx && !m.fainted ? ' active' : ''}"></div>`).join('');
    if (c.balls !== balls) { root.querySelector('.balls').innerHTML = balls; c.balls = balls; }
  },
};

function shadeHex(hex, amt) {
  const [r, g, b] = hexRgb(hex);
  const f = v => Math.max(0, Math.min(255, Math.round(v * (1 + amt))));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

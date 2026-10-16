// Original monster designs, drawn procedurally with the PixGrid primitives.
// Each draw function receives an empty grid and paints back-to-front.

const P = (b, s, l) => ({ b, s, l });
const DARK_EYE = '#1a1222';

const MONSTER_ART = {
  sparkit(g) {
    const Y = P('#ffd84a', '#e0a722', '#fff3a0');
    g.poly([[21, 23], [28, 16], [25, 15], [30, 8], [23, 12], [26, 13], [19, 20]], Y);           // bolt tail
    g.polyM([[11, 11], [4, 1], [14, 8]], Y);                                                   // ears
    g.polyM([[4, 1], [8, 2], [5, 5]], '#2a2230');                                              // ear tips
    g.ellipse(16, 23, 7, 6.5, Y, { edge: true });                                              // body
    g.ellipseM(10.5, 22, 2, 2.5, Y, { edge: true });                                           // arms
    g.ellipse(16, 14, 9, 7.5, Y, { edge: true });                                              // head
    g.ellipseM(12, 29, 3, 1.5, '#e0a722');                                                     // feet
    g.eyes(11, 12, DARK_EYE);
    g.ellipseM(9, 17, 2, 1.5, '#ff5a4a');                                                      // cheeks
    g.px(15, 17, OUTLINE).px(16, 17, OUTLINE).px(14, 16, OUTLINE).px(17, 16, OUTLINE);          // mouth
    g.rect(13, 24, 6, 1, '#c98a1a');                                                           // back stripe hint
  },

  cinderox(g) {
    const F = P('#ff7a1c', '#e2401a', '#ffd34a');
    const B = P('#2f4a7a', '#1f3054', '#4a6aa0');
    const C = P('#f3dd9a', '#d4b56a', '#fff2c4');
    g.poly([[7, 15], [9, 2], [14, 11]], F); g.poly([[12, 11], [16, 0], [20, 11]], F); g.poly([[18, 11], [23, 2], [25, 15]], F);
    g.poly([[11, 8], [16, 3], [21, 8], [16, 11]], '#ffd34a');
    g.ellipse(16, 21, 10, 7, B, { edge: true });
    g.ellipse(16, 24, 7, 5, C);
    g.ellipse(16, 14, 7, 6, B, { edge: true });
    g.ellipse(16, 17, 4, 2.5, C);
    g.ellipseM(10, 28, 3, 2, C, { edge: true });
    g.rectM(10, 13, 3, 1, OUTLINE); g.pxM(12, 14, '#ff5a2a');                                   // narrow eyes
    g.px(15, 16, OUTLINE).px(16, 16, OUTLINE);
    g.polyM([[6, 20], [2, 18], [6, 23]], F);                                                    // flank flames
  },

  tidalisk(g) {
    const B = P('#3d7fe0', '#2a58a8', '#7ab4ff');
    const C = P('#f2e6c0', '#cdbb88', '#fffbe6');
    const Fn = P('#bfe6ff', '#7ab4e8', '#ffffff');
    g.poly([[14, 6], [16, 0], [19, 6]], Fn);
    g.polyM([[10, 9], [2, 4], [8, 13]], Fn);
    g.ellipse(16, 26, 12, 4.5, B, { edge: true });
    g.ellipse(16, 19, 6, 8, B, { edge: true });
    g.ellipse(16, 21, 3.5, 6, C);
    g.ellipse(16, 10, 7, 5.5, B, { edge: true });
    g.ellipse(16, 13, 4, 2, C);
    g.eyes(12, 9, DARK_EYE);
    g.pxM(9, 26, '#7ab4ff'); g.pxM(6, 25, '#7ab4ff');
  },

  thornback(g) {
    const S = P('#3f9a3a', '#2a6b2a', '#77cc5a');
    const L = P('#8be04e', '#4fae2e', '#d4ff9a');
    const T = P('#e0c27a', '#b08f4a', '#f6e2a8');
    g.polyM([[10, 13], [6, 3], [14, 10]], L);
    g.poly([[13, 11], [16, 1], [19, 11]], L);
    g.ellipseM(8, 28, 3, 2.5, T, { edge: true });
    g.ellipse(16, 19, 12, 9, S, { edge: true });
    // shell plates
    for (const [x, y] of [[11, 15], [16, 13], [21, 15], [13, 20], [19, 20]]) { g.px(x, y, '#2a6b2a'); g.px(x + 1, y, '#2a6b2a'); g.px(x, y + 1, '#2a6b2a'); }
    g.ellipse(16, 23, 5.5, 4.5, T, { edge: true });
    g.rectM(13, 22, 1, 2, DARK_EYE); g.pxM(13, 22, '#ffffff');
    g.px(15, 25, OUTLINE).px(16, 25, OUTLINE);
  },

  slumbear(g) { // 44x44
    const B = P('#3f6f78', '#2a4c55', '#5d939c');
    const C = P('#f2e2bc', '#cdb98a', '#fff6de');
    g.ellipseM(11, 8, 3.5, 3.5, B);
    g.ellipse(22, 27, 17, 14, B, { edge: true });
    g.ellipse(22, 31, 12, 10, C);
    g.ellipseM(6, 27, 3.5, 6, B, { edge: true });
    g.ellipse(22, 14, 11, 8.5, B, { edge: true });
    g.ellipse(22, 16.5, 8, 5.5, C);
    g.rectM(16, 14, 4, 1, OUTLINE);                                                             // sleepy eyes
    g.rect(20, 19, 4, 1, OUTLINE); g.px(19, 18, OUTLINE); g.px(24, 18, OUTLINE);                // smile
    g.ellipseM(12, 41, 5, 2.5, C, { edge: true });
    g.pxM(10, 41, OUTLINE); g.pxM(12, 41, OUTLINE); g.pxM(14, 41, OUTLINE);
    g.pxM(11, 7, '#2a4c55');
  },

  frostling(g) {
    const B = P('#9fdcf0', '#5ea8cc', '#e8fbff');
    const Cr = P('#d8f4ff', '#8fcfee', '#ffffff');
    g.ellipse(25, 19, 5, 7.5, Cr);                                                              // fluffy tail
    g.polyM([[10, 10], [7, 1], [14, 8]], B);
    g.ellipse(16, 23, 6.5, 6, B, { edge: true });
    g.ellipse(16, 14, 7.5, 6, B, { edge: true });
    g.poly([[14, 9], [16, 2], [18, 9]], Cr, { edge: true });
    g.polyM([[9, 17], [5, 20], [10, 20]], Cr);                                                  // cheek frost
    g.ellipseM(12, 29, 2.5, 1.5, '#5ea8cc');
    g.eyes(12, 13, '#1a3a5a');
    g.px(15, 17, OUTLINE).px(16, 17, OUTLINE);
  },

  drakorn(g) {
    const O = P('#f08a3a', '#c45e1e', '#ffb873');
    const W = P('#7b4bd6', '#5430a0', '#a682ff');
    const C = P('#f6e2b0', '#d2b070', '#fff6dc');
    g.polyM([[10, 17], [0, 5], [2, 19]], W);
    g.poly([[21, 26], [31, 30], [24, 22]], O);
    g.polyM([[13, 9], [9, 1], [15, 6]], C, { edge: true });
    g.ellipse(16, 23, 8, 7.5, O, { edge: true });
    g.ellipse(16, 25, 5, 5.5, C);
    g.ellipse(16, 12, 7, 6, O, { edge: true });
    g.ellipse(16, 15, 4, 2.2, C);
    g.eyes(12, 10, DARK_EYE, { brow: true });
    g.px(15, 15, OUTLINE).px(16, 15, OUTLINE);
    g.ellipseM(11, 30, 2.5, 1.5, '#c45e1e');
  },

  boulderon(g) { // 44x44
    const R = P('#8f8170', '#625747', '#b8aa96');
    g.poly([[11, 17], [14, 5], [19, 14]], R, { edge: true });
    g.poly([[18, 13], [22, 2], [26, 13]], R, { edge: true });
    g.poly([[25, 14], [30, 5], [33, 17]], R, { edge: true });
    g.ellipse(22, 26, 15, 14, R, { edge: true });
    g.ellipseM(6, 28, 5, 6, R, { edge: true });
    g.ellipseM(14, 40, 4.5, 2.5, R, { edge: true });
    g.eyes(16, 22, '#ffb02a', { brow: true });
    g.rect(19, 30, 7, 1, OUTLINE); g.px(18, 29, OUTLINE); g.px(26, 29, OUTLINE);
    // cracks
    for (const [x, y] of [[12, 30], [13, 31], [13, 32], [30, 18], [31, 19], [29, 33], [30, 34]]) g.px(x, y, '#4e4436');
  },

  mindra(g) {
    const B = P('#c48ce8', '#9058b8', '#ebc8ff');
    g.poly([[19, 24], [30, 17], [27, 23], [31, 27], [21, 28]], B);
    g.polyM([[10, 8], [5, 0], [13, 5]], B);
    g.ellipse(16, 23, 5, 6.5, B, { edge: true });
    g.ellipse(16, 12, 8, 7, B, { edge: true });
    g.ellipse(16, 8.5, 1.6, 1.6, '#ff3a6a'); g.px(15, 8, '#ffd0dc');
    g.eyes(11, 11, '#5a1a8a', { h: 4 });
    g.px(16, 16, OUTLINE);
    g.ellipseM(13, 29.5, 2, 1.2, '#9058b8');
  },

  shadefang(g) {
    const B = P('#3a3550', '#24203a', '#5a5478');
    const G = P('#8a86a0', '#5e5a74', '#b4b0c8');
    g.poly([[21, 22], [31, 13], [28, 22], [24, 26]], B);
    g.polyM([[11, 10], [9, 1], [15, 7]], B);
    g.pxM(10, 4, '#d2384a'); g.pxM(10, 5, '#d2384a');
    g.ellipse(16, 22, 8, 6.5, B, { edge: true });
    g.ellipse(16, 18, 6, 2, '#d2384a');                                                         // collar
    g.ellipse(16, 13, 6.5, 5.5, B, { edge: true });
    g.ellipse(16, 16, 3, 2, G);
    g.eyes(12, 12, '#ff3a3a', { brow: true });
    g.px(15, 15, OUTLINE).px(16, 15, OUTLINE);
    g.ellipseM(11, 28.5, 2.5, 1.5, '#24203a');
  },

  lumawool(g) {
    const W = P('#fff3d6', '#d9c39a', '#ffffff');
    const Y = P('#ffd84a', '#e0a722', '#fff3a0');
    g.rect(26, 22, 1, 4, OUTLINE);
    g.ellipse(27, 21, 2.5, 2.5, '#ff4a3a');                                                      // tail orb
    g.rectM(11, 26, 2, 4, '#2a2230');
    g.ellipse(10, 20, 6, 6, W); g.ellipse(22, 20, 6, 6, W); g.ellipse(16, 15, 7, 6, W); g.ellipse(16, 23, 8, 6, W);
    g.polyM([[12, 11], [6, 13], [11, 15]], Y);
    g.ellipse(16, 12, 5, 5, Y, { edge: true });
    g.rectM(13, 6, 1, 3, '#2a2230');
    g.eyes(13, 11, DARK_EYE, { h: 2 });
    g.ellipse(16, 8, 1.5, 1.5, '#ff4a3a');
  },

  brawlix(g) {
    const T = P('#d9a066', '#a8703e', '#f2c896');
    const R = P('#d23a3a', '#9a2222', '#ff7a6a');
    g.poly([[21, 8], [28, 5], [27, 10]], '#d23a3a');                                              // headband tails
    g.ellipseM(12, 29, 2.2, 2, T, { edge: true });
    g.ellipse(16, 21, 6.5, 6, T, { edge: true });
    g.ellipse(16, 26, 6, 2.6, '#3a5ab8', { edge: true });
    g.ellipseM(10, 18, 2.5, 3.5, T, { edge: true });
    g.ellipseM(6.5, 21, 3.5, 3.5, R, { edge: true });
    g.ellipse(16, 11, 6, 5.5, T, { edge: true });
    g.rect(10, 8, 12, 2, '#d23a3a');
    g.eyes(13, 11, DARK_EYE, { brow: true, h: 2 });
    g.rect(15, 14, 2, 1, OUTLINE);
    g.rect(14, 19, 4, 1, '#a8703e');
  },
};

const SPRITES = {};

// Build every monster's normal + white-silhouette canvas once.
function buildSprites() {
  for (const mon of ROSTER) {
    const size = mon.size === 'L' ? 44 : 32;
    const g = new PixGrid(size, size);
    MONSTER_ART[mon.id](g);
    g.outline();
    SPRITES[mon.id] = { img: g.toCanvas(), white: g.toCanvas('#ffffff'), size };
  }
}

// Draw a monster into an arbitrary canvas, scaled to fit with integer pixels where possible.
function drawPortrait(canvas, monId, opts = {}) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const sp = SPRITES[monId];
  const s = Math.max(1, Math.floor(Math.min(canvas.width, canvas.height) / sp.size * (opts.zoom || 1)));
  const w = sp.size * s;
  const x = Math.round((canvas.width - w) / 2);
  const y = opts.crop ? Math.round(canvas.height * 0.08) : Math.round((canvas.height - w) / 2);
  if (opts.fainted) ctx.filter = 'grayscale(1) brightness(.6)';
  ctx.drawImage(sp.img, x, y, w, w);
  ctx.filter = 'none';
}

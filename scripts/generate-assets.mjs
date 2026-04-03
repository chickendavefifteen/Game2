/**
 * Cartoony sprite generator — Clash of Clans/Royale style.
 * Bold outlines, gradients, saturated colors, rounded bezier shapes.
 * Run with: node scripts/generate-assets.mjs
 */
import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../public/assets/sprites');
mkdirSync(OUT, { recursive: true });

function save(canvas, filename) {
  writeFileSync(join(OUT, filename), canvas.toBuffer('image/png'));
  console.log(`Generated: ${filename}`);
}

function mk(w, h) {
  const c = createCanvas(w, h);
  return { c, ctx: c.getContext('2d') };
}

// Legacy pixel helpers kept for small sprites (bomb, UI, terrain)
function px(ctx, x, y, color) {
  if (!color || color === 'transparent') return;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}
function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// Cartoony helpers
function stroke(ctx, lw = 2.5, color = '#1a0800') {
  ctx.lineWidth = lw;
  ctx.strokeStyle = color;
  ctx.stroke();
}
function fill(ctx, color) { ctx.fillStyle = color; ctx.fill(); }
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ─── AIRCRAFT 48×48 per frame, 4 frames = 192×48 ────────────────────────────
// Top-down F-16 style. Nose points UP (toward y=0). Engine at bottom.
{
  const FW = 48, FH = 48;
  const { c, ctx } = mk(FW * 4, FH);
  // afterburner colours cycle across frames
  const glowColors = ['#ff7700','#ffaa00','#ff5500','#ffcc44'];

  for (let fi = 0; fi < 4; fi++) {
    const ox = fi * FW;
    ctx.save();
    ctx.translate(ox, 0);

    // ── drop shadow
    ctx.beginPath();
    ctx.ellipse(24, 34, 12, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fill();

    // ── afterburner glow (behind tail)
    {
      const gc = glowColors[fi];
      const grd = ctx.createRadialGradient(24, 44, 0, 24, 44, 9);
      grd.addColorStop(0, gc);
      grd.addColorStop(0.5, gc + 'aa');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(24, 44, 5, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── LEFT wing (swept back)
    {
      const wg = ctx.createLinearGradient(3, 22, 22, 32);
      wg.addColorStop(0, '#4477cc');
      wg.addColorStop(1, '#223388');
      ctx.beginPath();
      ctx.moveTo(22, 24); // wing root front
      ctx.bezierCurveTo(16, 22, 5, 26, 2, 32); // tip
      ctx.bezierCurveTo(5, 31, 14, 30, 22, 30); // wing root back
      ctx.closePath();
      ctx.fillStyle = wg; ctx.fill(); stroke(ctx, 2);
    }
    // ── RIGHT wing (mirror)
    {
      const wg = ctx.createLinearGradient(26, 22, 45, 32);
      wg.addColorStop(0, '#4477cc');
      wg.addColorStop(1, '#223388');
      ctx.beginPath();
      ctx.moveTo(26, 24);
      ctx.bezierCurveTo(32, 22, 43, 26, 46, 32);
      ctx.bezierCurveTo(43, 31, 34, 30, 26, 30);
      ctx.closePath();
      ctx.fillStyle = wg; ctx.fill(); stroke(ctx, 2);
    }

    // ── tail fins
    for (const [sx, ex] of [[21, 15], [27, 33]]) {
      ctx.beginPath();
      ctx.moveTo(sx, 36);
      ctx.lineTo(ex, 44);
      ctx.lineTo(sx + (sx < 24 ? 2 : -2), 43);
      ctx.closePath();
      ctx.fillStyle = '#2244aa'; ctx.fill(); stroke(ctx, 1.5);
    }

    // ── main fuselage body
    {
      const fg = ctx.createLinearGradient(19, 4, 29, 44);
      fg.addColorStop(0,   '#f0f0f5');
      fg.addColorStop(0.25,'#c8daf0');
      fg.addColorStop(0.6, '#8099c8');
      fg.addColorStop(1,   '#445577');
      ctx.beginPath();
      ctx.moveTo(24, 3); // nose tip
      ctx.bezierCurveTo(21, 7, 19, 14, 19, 24);
      ctx.bezierCurveTo(19, 32, 20, 37, 22, 43);
      ctx.lineTo(26, 43);
      ctx.bezierCurveTo(28, 37, 29, 32, 29, 24);
      ctx.bezierCurveTo(29, 14, 27, 7, 24, 3);
      ctx.closePath();
      ctx.fillStyle = fg; ctx.fill(); stroke(ctx, 2.5);
    }

    // ── nose cone highlight
    {
      const ng = ctx.createLinearGradient(21, 2, 27, 11);
      ng.addColorStop(0, '#ffffff');
      ng.addColorStop(1, '#99aabb');
      ctx.beginPath();
      ctx.moveTo(24, 2);
      ctx.bezierCurveTo(21, 4, 20, 8, 20, 10);
      ctx.bezierCurveTo(22, 9, 26, 9, 28, 10);
      ctx.bezierCurveTo(28, 8, 27, 4, 24, 2);
      ctx.closePath();
      ctx.fillStyle = ng; ctx.fill(); stroke(ctx, 1.5);
    }

    // ── cockpit canopy
    {
      const cg = ctx.createRadialGradient(22, 15, 1, 24, 18, 7);
      cg.addColorStop(0, '#aaf0ff');
      cg.addColorStop(0.5, '#44aaee');
      cg.addColorStop(1, '#1133bb');
      ctx.beginPath();
      ctx.ellipse(24, 18, 4, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = cg; ctx.fill(); stroke(ctx, 2);
      // shine
      ctx.beginPath();
      ctx.ellipse(22, 15, 1.5, 2.5, -0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.fill();
    }

    // ── US roundels on wings
    for (const [rx, ry] of [[10, 28], [38, 28]]) {
      ctx.beginPath(); ctx.arc(rx, ry, 4.5, 0, Math.PI*2);
      ctx.fillStyle = '#dd2222'; ctx.fill(); stroke(ctx, 1.5);
      ctx.beginPath(); ctx.arc(rx, ry, 3, 0, Math.PI*2);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.beginPath(); ctx.arc(rx, ry, 1.8, 0, Math.PI*2);
      ctx.fillStyle = '#2244cc'; ctx.fill();
    }

    // ── fuselage stripe (red/white)
    ctx.beginPath(); roundRect(ctx, 20, 26, 8, 1.5, 0.5);
    ctx.fillStyle = '#dd2222'; ctx.fill();
    ctx.beginPath(); roundRect(ctx, 20, 27.5, 8, 1.5, 0.5);
    ctx.fillStyle = '#ffffff'; ctx.fill();

    ctx.restore();
  }
  save(c, 'aircraft.png');
}

// ─── SILO 48×48 per frame, 6 frames = 288×48 ────────────────────────────────
// Frame 0: closed. 1: warning glow. 2: doors open + missile tip. 3-5: destruction.
{
  const FW = 48, FH = 48;
  const { c, ctx } = mk(FW * 6, FH);

  function drawBunker(ox, doorOpenRatio, glowAlpha) {
    ctx.save();
    ctx.translate(ox, 0);

    // ── ground shadow
    ctx.beginPath();
    ctx.ellipse(24, 45, 16, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fill();

    // ── base mound (earth)
    {
      const eg = ctx.createLinearGradient(8, 28, 40, 46);
      eg.addColorStop(0, '#b8976a');
      eg.addColorStop(0.5, '#8b6340');
      eg.addColorStop(1, '#5c3d1e');
      ctx.beginPath();
      ctx.moveTo(6, 46);
      ctx.bezierCurveTo(6, 38, 10, 34, 14, 32);
      ctx.lineTo(34, 32);
      ctx.bezierCurveTo(38, 34, 42, 38, 42, 46);
      ctx.closePath();
      ctx.fillStyle = eg; ctx.fill(); stroke(ctx, 2.5);
    }

    // ── concrete bunker body
    {
      const cg = ctx.createLinearGradient(10, 12, 38, 34);
      cg.addColorStop(0, '#ccbbaa');
      cg.addColorStop(0.4, '#aa9980');
      cg.addColorStop(1, '#7a6650');
      ctx.beginPath();
      ctx.moveTo(10, 34);
      ctx.lineTo(8, 20);
      ctx.bezierCurveTo(8, 14, 12, 12, 16, 12);
      ctx.lineTo(32, 12);
      ctx.bezierCurveTo(36, 12, 40, 14, 40, 20);
      ctx.lineTo(38, 34);
      ctx.closePath();
      ctx.fillStyle = cg; ctx.fill(); stroke(ctx, 2.5);
      // highlight left edge
      ctx.beginPath(); ctx.moveTo(10, 34); ctx.lineTo(9, 22);
      ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1.5; ctx.stroke();
    }

    // ── door seam / hatch outline
    if (doorOpenRatio < 1) {
      const dh = (1 - doorOpenRatio) * 22;
      // left door
      const ld = ctx.createLinearGradient(14, 12, 23, 34);
      ld.addColorStop(0, '#999988');
      ld.addColorStop(1, '#666655');
      ctx.beginPath();
      ctx.rect(14, 12, 9, dh);
      ctx.fillStyle = ld; ctx.fill(); stroke(ctx, 1.5);
      // right door
      const rd = ctx.createLinearGradient(25, 12, 34, 34);
      rd.addColorStop(0, '#999988');
      rd.addColorStop(1, '#666655');
      ctx.beginPath();
      ctx.rect(25, 12, 9, dh);
      ctx.fillStyle = rd; ctx.fill(); stroke(ctx, 1.5);
    }

    // ── inner dark shaft (visible when open)
    if (doorOpenRatio > 0) {
      const sh = ctx.createLinearGradient(14, 12, 34, 34);
      sh.addColorStop(0, '#110800');
      sh.addColorStop(1, '#221100');
      ctx.beginPath();
      ctx.rect(14, 12 + (1 - doorOpenRatio) * 22, 20, doorOpenRatio * 22);
      ctx.fillStyle = sh; ctx.fill();
    }

    // ── warning glow around hatch
    if (glowAlpha > 0) {
      const gg = ctx.createRadialGradient(24, 18, 2, 24, 20, 14);
      gg.addColorStop(0, `rgba(255,100,0,${glowAlpha})`);
      gg.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = gg;
      ctx.beginPath(); ctx.rect(10, 10, 28, 26);
      ctx.fill();
    }

    // ── bolt details on bunker sides
    for (const [bx, by] of [[12,16],[12,24],[36,16],[36,24]]) {
      ctx.beginPath(); ctx.arc(bx, by, 1.5, 0, Math.PI*2);
      ctx.fillStyle = '#ccbbaa'; ctx.fill(); stroke(ctx, 1, '#554433');
    }

    ctx.restore();
  }

  // Frame 0: closed idle
  drawBunker(0, 0, 0);
  // Frame 1: warning pulse
  drawBunker(48, 0, 0.5);
  // Frame 2: doors open, missile visible
  drawBunker(96, 1, 0.8);
  // draw missile tip in shaft
  {
    const ox = 96;
    const mrg = ctx.createLinearGradient(ox+19, 4, ox+29, 14);
    mrg.addColorStop(0, '#ffdd44');
    mrg.addColorStop(1, '#cc2200');
    ctx.beginPath();
    ctx.moveTo(ox+24, 4);
    ctx.bezierCurveTo(ox+21, 6, ox+20, 9, ox+20, 12);
    ctx.lineTo(ox+28, 12);
    ctx.bezierCurveTo(ox+28, 9, ox+27, 6, ox+24, 4);
    ctx.closePath();
    ctx.fillStyle = mrg; ctx.fill(); stroke(ctx, 1.5);
  }

  // Frames 3-5: destruction progression
  const destroyStages = [
    { smoke: 0.6, fireAlpha: 0.9, rubble: false },
    { smoke: 0.85, fireAlpha: 0.4, rubble: true },
    { smoke: 1.0, fireAlpha: 0, rubble: true },
  ];
  destroyStages.forEach(({ smoke, fireAlpha, rubble }, i) => {
    const ox = (3 + i) * FW;
    ctx.save();
    ctx.translate(ox, 0);

    // ── rubble base
    {
      const rg = ctx.createLinearGradient(4, 30, 44, 48);
      rg.addColorStop(0, '#8b6340');
      rg.addColorStop(1, '#4a3020');
      ctx.beginPath();
      ctx.moveTo(4, 46);
      ctx.bezierCurveTo(8, 36, 14, 32, 22, 32);
      ctx.bezierCurveTo(30, 32, 38, 35, 44, 46);
      ctx.closePath();
      ctx.fillStyle = rg; ctx.fill(); stroke(ctx, 2);
    }

    // ── rubble chunks
    if (rubble) {
      for (const [rx, ry, rw, rh] of [[6,34,8,5],[20,30,6,4],[33,33,9,5],[15,36,5,4]]) {
        ctx.beginPath(); roundRect(ctx, rx, ry, rw, rh, 2);
        ctx.fillStyle = '#99887a'; ctx.fill(); stroke(ctx, 1.5);
      }
    }

    // ── fire
    if (fireAlpha > 0) {
      const fg = ctx.createRadialGradient(24, 28, 2, 24, 24, 16);
      fg.addColorStop(0, `rgba(255,220,50,${fireAlpha})`);
      fg.addColorStop(0.4, `rgba(255,100,0,${fireAlpha * 0.9})`);
      fg.addColorStop(1, 'rgba(200,20,0,0)');
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.ellipse(24, 26, 12, 14, 0, 0, Math.PI*2);
      ctx.fill();
    }

    // ── smoke
    for (let s = 0; s < 3; s++) {
      const sx = 18 + s * 5, sy = 20 - s * 6;
      const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 6 + s * 2);
      sg.addColorStop(0, `rgba(120,110,100,${smoke * 0.7})`);
      sg.addColorStop(1, 'rgba(80,70,60,0)');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(sx, sy, 6 + s * 2, 0, Math.PI*2); ctx.fill();
    }

    ctx.restore();
  });

  save(c, 'silo.png');
}

// ─── BOMB 20×28 ──────────────────────────────────────────────────────────────
{
  const { c, ctx } = mk(20, 28);
  // body gradient
  const bg = ctx.createLinearGradient(4, 2, 16, 22);
  bg.addColorStop(0, '#ddddcc');
  bg.addColorStop(0.4, '#999988');
  bg.addColorStop(1, '#555544');
  ctx.beginPath();
  ctx.moveTo(10, 1);
  ctx.bezierCurveTo(7, 3, 5, 6, 5, 10);
  ctx.lineTo(5, 20);
  ctx.bezierCurveTo(5, 23, 7, 24, 10, 24);
  ctx.bezierCurveTo(13, 24, 15, 23, 15, 20);
  ctx.lineTo(15, 10);
  ctx.bezierCurveTo(15, 6, 13, 3, 10, 1);
  ctx.closePath();
  ctx.fillStyle = bg; ctx.fill(); stroke(ctx, 2);
  // yellow nose ring
  ctx.beginPath(); ctx.arc(10, 3, 2.5, 0, Math.PI*2);
  ctx.fillStyle = '#ffcc00'; ctx.fill(); stroke(ctx, 1.5);
  // fins
  for (const [fx, fy] of [[3, 20], [14, 20]]) {
    ctx.beginPath();
    ctx.moveTo(fx + (fx < 10 ? 2 : 0), fy);
    ctx.lineTo(fx < 10 ? 1 : 19, fy + 5);
    ctx.lineTo(fx + (fx < 10 ? 2 : 0), fy + 3);
    ctx.closePath();
    ctx.fillStyle = '#888877'; ctx.fill(); stroke(ctx, 1.5);
  }
  // stripe
  ctx.beginPath(); roundRect(ctx, 5, 13, 10, 2, 1);
  ctx.fillStyle = '#ff4422'; ctx.fill(); stroke(ctx, 1);
  save(c, 'bomb.png');
}

// ─── ENEMY MISSILE 20×36 per frame, 2 frames = 40×36 ────────────────────────
{
  const FW = 20, FH = 36;
  const { c, ctx } = mk(FW * 2, FH);
  const exhaustCols = ['#ff8800', '#ffdd00'];

  for (let fi = 0; fi < 2; fi++) {
    const ox = fi * FW;
    ctx.save(); ctx.translate(ox, 0);

    // ── exhaust plume
    {
      const eg = ctx.createRadialGradient(10, 34, 0, 10, 32, 7);
      eg.addColorStop(0, exhaustCols[fi]);
      eg.addColorStop(0.6, exhaustCols[fi] + '99');
      eg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = eg;
      ctx.beginPath(); ctx.ellipse(10, 33, 4, 7, 0, 0, Math.PI*2); ctx.fill();
    }

    // ── fins
    for (const [fx] of [[3], [14]]) {
      ctx.beginPath();
      ctx.moveTo(fx < 10 ? 6 : 14, 24);
      ctx.lineTo(fx < 10 ? 1 : 19, 32);
      ctx.lineTo(fx < 10 ? 6 : 14, 30);
      ctx.closePath();
      ctx.fillStyle = '#cc1100'; ctx.fill(); stroke(ctx, 1.5);
    }

    // ── body
    {
      const mg = ctx.createLinearGradient(5, 2, 15, 26);
      mg.addColorStop(0, '#ff5533');
      mg.addColorStop(0.5, '#cc2200');
      mg.addColorStop(1, '#881100');
      ctx.beginPath();
      ctx.moveTo(10, 1); // nose tip
      ctx.bezierCurveTo(7, 4, 6, 8, 6, 12);
      ctx.lineTo(6, 28);
      ctx.bezierCurveTo(6, 30, 7, 31, 10, 31);
      ctx.bezierCurveTo(13, 31, 14, 30, 14, 28);
      ctx.lineTo(14, 12);
      ctx.bezierCurveTo(14, 8, 13, 4, 10, 1);
      ctx.closePath();
      ctx.fillStyle = mg; ctx.fill(); stroke(ctx, 2);
    }

    // ── nose cone
    ctx.beginPath();
    ctx.moveTo(10, 1);
    ctx.bezierCurveTo(7, 3, 6, 6, 6, 9);
    ctx.bezierCurveTo(7.5, 8, 12.5, 8, 14, 9);
    ctx.bezierCurveTo(14, 6, 13, 3, 10, 1);
    ctx.closePath();
    ctx.fillStyle = '#ffdd22'; ctx.fill(); stroke(ctx, 1.5);

    // ── white stripe
    ctx.beginPath(); roundRect(ctx, 6, 16, 8, 2.5, 1);
    ctx.fillStyle = '#ffffff'; ctx.fill(); stroke(ctx, 1);

    // ── nose shine
    ctx.beginPath(); ctx.ellipse(8.5, 3.5, 1, 2, -0.5, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();

    ctx.restore();
  }
  save(c, 'enemy_missile.png');
}

// ─── PLAYER MISSILE 14×24 per frame, 2 frames = 28×24 ───────────────────────
{
  const FW = 14, FH = 24;
  const { c, ctx } = mk(FW * 2, FH);
  const exhaustCols = ['#44aaff', '#88ccff'];

  for (let fi = 0; fi < 2; fi++) {
    const ox = fi * FW;
    ctx.save(); ctx.translate(ox, 0);

    // exhaust glow
    {
      const eg = ctx.createRadialGradient(7, 22, 0, 7, 21, 5);
      eg.addColorStop(0, exhaustCols[fi]);
      eg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = eg;
      ctx.beginPath(); ctx.ellipse(7, 22, 3, 5, 0, 0, Math.PI*2); ctx.fill();
    }
    // fins
    for (const left of [true, false]) {
      ctx.beginPath();
      ctx.moveTo(left ? 5 : 9, 18);
      ctx.lineTo(left ? 1 : 13, 22);
      ctx.lineTo(left ? 5 : 9, 21);
      ctx.closePath();
      ctx.fillStyle = '#2255cc'; ctx.fill(); stroke(ctx, 1.2);
    }
    // body
    {
      const mg = ctx.createLinearGradient(3, 1, 11, 20);
      mg.addColorStop(0, '#ddeeff');
      mg.addColorStop(0.5, '#7799cc');
      mg.addColorStop(1, '#334488');
      ctx.beginPath();
      ctx.moveTo(7, 1);
      ctx.bezierCurveTo(4.5, 3, 4, 6, 4, 10);
      ctx.lineTo(4, 20);
      ctx.bezierCurveTo(4, 21, 5, 22, 7, 22);
      ctx.bezierCurveTo(9, 22, 10, 21, 10, 20);
      ctx.lineTo(10, 10);
      ctx.bezierCurveTo(10, 6, 9.5, 3, 7, 1);
      ctx.closePath();
      ctx.fillStyle = mg; ctx.fill(); stroke(ctx, 1.8);
    }
    // nose
    ctx.beginPath(); ctx.arc(7, 3, 2.5, Math.PI, 0);
    ctx.fillStyle = '#ffffff'; ctx.fill(); stroke(ctx, 1.2);
    // shine
    ctx.beginPath(); ctx.ellipse(5.5, 3, 1, 1.5, -0.4, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();

    ctx.restore();
  }
  save(c, 'aircraft_missile.png');
}

// ─── SHIP 80×36 per frame, 2 frames = 160×36 ────────────────────────────────
// Frame 0/1: wake animation. Ship faces RIGHT.
{
  const FW = 80, FH = 36;
  const { c, ctx } = mk(FW * 2, FH);

  for (let fi = 0; fi < 2; fi++) {
    const ox = fi * FW;
    ctx.save(); ctx.translate(ox, 0);

    // ── wake foam (behind = left side since ship faces right)
    {
      const wOff = fi === 0 ? 0 : 1;
      for (const [wx, wy, wr] of [[4+wOff, 30, 5], [10+wOff, 32, 3], [2, 28, 3]]) {
        const wg = ctx.createRadialGradient(wx, wy, 0, wx, wy, wr);
        wg.addColorStop(0, 'rgba(255,255,255,0.7)');
        wg.addColorStop(1, 'rgba(180,220,255,0)');
        ctx.fillStyle = wg;
        ctx.beginPath(); ctx.ellipse(wx, wy, wr * 1.8, wr * 0.7, 0, 0, Math.PI*2); ctx.fill();
      }
    }

    // ── hull (red/orange tanker — facing right, bow on right)
    {
      const hg = ctx.createLinearGradient(5, 18, 5, 34);
      hg.addColorStop(0, '#ee4411');
      hg.addColorStop(0.5, '#cc2200');
      hg.addColorStop(1, '#881100');
      ctx.beginPath();
      ctx.moveTo(8, 20);  // stern left top
      ctx.lineTo(66, 20); // deck level
      ctx.bezierCurveTo(72, 20, 76, 22, 78, 25); // bow curve
      ctx.bezierCurveTo(76, 28, 72, 30, 66, 30);
      ctx.lineTo(8, 30);
      ctx.bezierCurveTo(5, 30, 4, 28, 4, 25);
      ctx.bezierCurveTo(4, 22, 5, 20, 8, 20);
      ctx.closePath();
      ctx.fillStyle = hg; ctx.fill(); stroke(ctx, 2.5);
    }

    // ── waterline stripe (white)
    ctx.beginPath(); roundRect(ctx, 6, 19, 70, 2, 1);
    ctx.fillStyle = '#ffffff'; ctx.fill();

    // ── deck (flat top area)
    {
      const dg = ctx.createLinearGradient(8, 10, 8, 20);
      dg.addColorStop(0, '#cc9966');
      dg.addColorStop(1, '#aa7744');
      ctx.beginPath(); roundRect(ctx, 8, 12, 58, 8, 2);
      ctx.fillStyle = dg; ctx.fill(); stroke(ctx, 1.5);
    }

    // ── oil drums on deck (left cluster)
    for (let i = 0; i < 4; i++) {
      const dx = 10 + i * 8;
      ctx.beginPath(); roundRect(ctx, dx, 13, 6, 6, 2);
      const drg = ctx.createLinearGradient(dx, 13, dx+6, 19);
      drg.addColorStop(0, '#dd6622');
      drg.addColorStop(1, '#882200');
      ctx.fillStyle = drg; ctx.fill(); stroke(ctx, 1.5);
      ctx.beginPath(); roundRect(ctx, dx+1, 13, 4, 2, 1);
      ctx.fillStyle = '#ff8844'; ctx.fill();
    }
    // ── oil drums (right cluster)
    for (let i = 0; i < 3; i++) {
      const dx = 48 + i * 7;
      ctx.beginPath(); roundRect(ctx, dx, 13, 6, 6, 2);
      const drg = ctx.createLinearGradient(dx, 13, dx+6, 19);
      drg.addColorStop(0, '#dd6622');
      drg.addColorStop(1, '#882200');
      ctx.fillStyle = drg; ctx.fill(); stroke(ctx, 1.5);
    }

    // ── superstructure (white block, stern side)
    {
      const sg = ctx.createLinearGradient(10, 4, 30, 14);
      sg.addColorStop(0, '#f5f5f0');
      sg.addColorStop(1, '#ccccbb');
      ctx.beginPath(); roundRect(ctx, 10, 5, 20, 10, 3);
      ctx.fillStyle = sg; ctx.fill(); stroke(ctx, 2);
    }
    // bridge windows
    for (const [wx, wy] of [[13,7],[18,7],[23,7]]) {
      ctx.beginPath(); roundRect(ctx, wx, wy, 3, 3, 1);
      const wng = ctx.createLinearGradient(wx, wy, wx+3, wy+3);
      wng.addColorStop(0, '#bbeeFF');
      wng.addColorStop(1, '#4499cc');
      ctx.fillStyle = wng; ctx.fill(); stroke(ctx, 1);
    }
    // ── radar mast
    ctx.beginPath();
    ctx.moveTo(20, 5); ctx.lineTo(20, 1);
    ctx.strokeStyle = '#888'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(17, 2); ctx.lineTo(23, 2);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(20, 1, 1.5, 0, Math.PI*2);
    ctx.fillStyle = '#ffcc00'; ctx.fill(); stroke(ctx, 1);

    ctx.restore();
  }
  save(c, 'ship.png');
}

// ─── EXPLOSION 48×48 per frame, 8 frames = 384×48 ───────────────────────────
// Cartoony fireball with radial gradients and spiky outline
{
  const FW = 48, FH = 48;
  const { c, ctx } = mk(FW * 8, FH);

  const stages = [
    { r: 6,  inner: '#ffffff', mid: '#ffff88', outer: '#ffdd00', alpha: 1 },
    { r: 11, inner: '#ffffff', mid: '#ffee44', outer: '#ff8800', alpha: 1 },
    { r: 16, inner: '#fff9aa', mid: '#ffcc00', outer: '#ff5500', alpha: 1 },
    { r: 20, inner: '#ffee44', mid: '#ff8800', outer: '#cc2200', alpha: 1 },
    { r: 20, inner: '#ff9900', mid: '#cc3300', outer: '#881100', alpha: 0.95 },
    { r: 17, inner: '#cc4400', mid: '#882200', outer: '#441100', alpha: 0.85 },
    { r: 13, inner: '#886655', mid: '#554433', outer: '#333322', alpha: 0.7 },
    { r:  8, inner: '#666655', mid: '#444433', outer: '#222211', alpha: 0.45 },
  ];

  stages.forEach(({ r, inner, mid, outer, alpha }, fi) => {
    const cx = fi * FW + FW / 2;
    const cy = FH / 2;

    ctx.save();
    ctx.globalAlpha = alpha;

    // ── spiky halo (jagged edge outline)
    if (fi < 6) {
      const spikes = 8 + fi;
      const outerR = r + 4 + fi * 0.5;
      const innerR = r - 1;
      ctx.beginPath();
      for (let s = 0; s < spikes * 2; s++) {
        const angle = (s / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
        const sr = s % 2 === 0 ? outerR : innerR;
        const px2 = cx + Math.cos(angle) * sr;
        const py2 = cy + Math.sin(angle) * sr;
        s === 0 ? ctx.moveTo(px2, py2) : ctx.lineTo(px2, py2);
      }
      ctx.closePath();
      ctx.fillStyle = outer + (fi < 3 ? 'cc' : '88');
      ctx.fill();
    }

    // ── main fireball
    const rg = ctx.createRadialGradient(cx - r*0.2, cy - r*0.2, 0, cx, cy, r);
    rg.addColorStop(0,   inner);
    rg.addColorStop(0.4, mid);
    rg.addColorStop(0.8, outer);
    rg.addColorStop(1,   outer + '00');
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

    // ── shockwave ring on early frames
    if (fi <= 2) {
      ctx.beginPath(); ctx.arc(cx, cy, r + fi * 3 + 2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,200,0,${0.5 - fi * 0.15})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // ── smoke puffs on late frames
    if (fi >= 5) {
      for (const [sx, sy, sr2] of [[-r*0.3, -r*0.7, r*0.5], [r*0.2, -r*0.8, r*0.4], [r*0.5, -r*0.5, r*0.35]]) {
        const smg = ctx.createRadialGradient(cx+sx, cy+sy, 0, cx+sx, cy+sy, sr2);
        smg.addColorStop(0, `rgba(100,90,80,${0.6 * alpha})`);
        smg.addColorStop(1, 'rgba(60,55,50,0)');
        ctx.fillStyle = smg;
        ctx.beginPath(); ctx.arc(cx+sx, cy+sy, sr2, 0, Math.PI*2); ctx.fill();
      }
    }

    ctx.restore();
  });
  save(c, 'explosion.png');
}

// ─── OIL SLICK 32x10 per frame, 4 frames = 128x10 ───────────────────────────
{
  const { c, ctx } = mk(128, 10);
  [4, 8, 12, 16].forEach((r, fi) => {
    const cx = fi*32+16, cy = 5;
    const ry = Math.round(r * 0.35);
    for (let dy = -ry; dy <= ry; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if ((dx*dx)/(r*r) + (dy*dy)/(Math.max(ry,1)*Math.max(ry,1)) > 1) continue;
        const hue = 180 + ((dx+r)/(2*r)) * 80;
        ctx.fillStyle = `hsla(${hue},80%,20%,0.9)`;
        ctx.fillRect(cx+dx, cy+dy, 1, 1);
      }
    }
  });
  save(c, 'oil_slick.png');
}

// ─── TERRAIN TILESET 16x16 per tile, 8 tiles = 128x16 ───────────────────────
{
  const { c, ctx } = mk(128, 16);

  // Tile 0: deep water
  { const ox=0;
    for (let y=0;y<16;y++) for (let x=0;x<16;x++)
      px(ctx,ox+x,y,(x+y)%4===0?'#1a3a6a':'#1a3058');
    px(ctx,ox+3,2,'#2244aa'); px(ctx,ox+11,9,'#2244aa'); }

  // Tile 1: shallow water
  { const ox=16;
    for (let y=0;y<16;y++) for (let x=0;x<16;x++)
      px(ctx,ox+x,y,(x+y)%3===0?'#2255aa':'#1e4a88'); }

  // Tile 2: sand/coast
  { const ox=32;
    for (let y=0;y<16;y++) for (let x=0;x<16;x++)
      px(ctx,ox+x,y,(x*y)%5===0?'#d4b483':'#c4a472');
    for (let x=0;x<16;x++) px(ctx,ox+x,15,'#a08040'); }

  // Tile 3: rock
  { const ox=48;
    for (let y=0;y<16;y++) for (let x=0;x<16;x++)
      px(ctx,ox+x,y,(x+y*2)%4===0?'#888':'#666');
    [2,5,9,13].forEach(x=>px(ctx,ox+x,0,'#aaa')); }

  // Tile 4: city block
  { const ox=64;
    for (let y=0;y<16;y++) for (let x=0;x<16;x++) px(ctx,ox+x,y,'#c8b89a');
    for (let y=3;y<=12;y++) for (let x=2;x<=13;x++) px(ctx,ox+x,y,'#aa9978');
    [[3,4],[6,4],[9,4],[3,8],[6,8],[9,8]].forEach(([wx,wy])=>{
      px(ctx,ox+wx,wy,'#88ddff'); px(ctx,ox+wx+1,wy,'#88ddff'); });
    for (let x=0;x<16;x++) px(ctx,ox+x,15,'#888'); }

  // Tile 5: city damaged
  { const ox=80;
    for (let y=0;y<16;y++) for (let x=0;x<16;x++) px(ctx,ox+x,y,'#c8b89a');
    for (let y=3;y<=12;y++) for (let x=2;x<=13;x++) px(ctx,ox+x,y,'#886644');
    [4,6,8,10].forEach(y=>px(ctx,ox+7,y,'#333'));
    for (let x=4;x<=8;x++) px(ctx,ox+x,12,'#222'); }

  // Tile 6: desert
  { const ox=96;
    for (let y=0;y<16;y++) for (let x=0;x<16;x++)
      px(ctx,ox+x,y,(x*3+y)%7===0?'#e8c878':'#d4b460'); }

  // Tile 7: road
  { const ox=112;
    for (let y=0;y<16;y++) for (let x=0;x<16;x++) px(ctx,ox+x,y,'#666');
    for (let y=0;y<16;y+=4) { px(ctx,ox+7,y,'#ffff00'); px(ctx,ox+8,y,'#ffff00'); } }

  save(c, 'terrain.png');
}

// ─── RETICLE 24x24 ──────────────────────────────────────────────────────────
{
  const { c, ctx } = mk(24, 24);
  // Corner brackets
  for (let i=0;i<7;i++) { px(ctx,i,0,'#ff4444'); px(ctx,0,i,'#ff4444'); }
  for (let i=17;i<24;i++) { px(ctx,i,0,'#ff4444'); px(ctx,23,i-17,'#ff4444'); }
  for (let i=0;i<7;i++) { px(ctx,i,23,'#ff4444'); px(ctx,0,23-i,'#ff4444'); }
  for (let i=17;i<24;i++) { px(ctx,i,23,'#ff4444'); px(ctx,23,17+(i-17),'#ff4444'); }
  // Center
  rect(ctx, 10,10, 4,4, '#ff444488');
  rect(ctx, 11,11, 2,2, '#ff4444');
  save(c, 'reticle.png');
}

// ─── MOVE INDICATOR 12x12 ───────────────────────────────────────────────────
{
  const { c, ctx } = mk(12, 12);
  rect(ctx, 0,5, 12,2, '#ffff00');
  rect(ctx, 5,0,  2,12, '#ffff00');
  save(c, 'move_indicator.png');
}

// ─── UI SPRITESHEET 128x32 ──────────────────────────────────────────────────
{
  const { c, ctx } = mk(128, 32);
  // Timer bar
  rect(ctx, 0,0, 10,8, '#cc2200');
  rect(ctx, 10,0, 40,8, '#ddaa00');
  rect(ctx, 50,0, 78,8, '#22aa22');
  // Life icon (aircraft)
  rect(ctx, 0,12, 2,2, '#aaa'); rect(ctx,3,12,6,1,'#aaa');
  rect(ctx, 1,14,10,2, '#5577aa'); rect(ctx,4,13,4,2,'#bbb');
  rect(ctx, 2,16, 8,1, '#888'); rect(ctx,4,17,4,2,'#ff8800');
  // Oil barrel
  rect(ctx,16,12, 12,10, '#884400'); rect(ctx,17,13,10,8,'#aa5500');
  rect(ctx,17,16, 10,2, '#cc6600');
  save(c, 'ui.png');
}

console.log('\nAll cartoony assets generated!');

/**
 * Pixel art asset generator — 2× larger sprites for portrait mobile.
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

function px(ctx, x, y, color) {
  if (!color || color === 'transparent') return;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

// Draw a filled rectangle of pixels
function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// ─── AIRCRAFT 32x32 per frame, 4 frames = 128x32 ────────────────────────────
{
  const { c, ctx } = mk(128, 32);
  const exhaustColors = ['#ff8800', '#ffaa00', '#ff6600', '#ffcc00'];

  for (let fi = 0; fi < 4; fi++) {
    const ox = fi * 32;
    // Fuselage
    rect(ctx, ox+13, 10, 6, 12, '#999');
    rect(ctx, ox+14, 8,  4, 14, '#bbb');
    rect(ctx, ox+15, 6,  2, 16, '#ddd');
    // Nose
    rect(ctx, ox+15, 4,  2,  3, '#eee');
    px(ctx,  ox+15, 3, '#ccc');
    px(ctx,  ox+16, 3, '#ccc');
    // Cockpit
    rect(ctx, ox+14, 9,  4,  4, '#55ccff');
    rect(ctx, ox+15, 9,  2,  3, '#88eeff');
    // Wings
    rect(ctx, ox+6,  16, 20, 3, '#4466aa');
    rect(ctx, ox+8,  15, 16, 1, '#5577bb');
    rect(ctx, ox+4,  17, 24, 1, '#3355aa');
    // Wing tips
    rect(ctx, ox+4,  18,  3, 2, '#334499');
    rect(ctx, ox+25, 18,  3, 2, '#334499');
    // Tail fins
    rect(ctx, ox+14, 21,  4, 3, '#4466aa');
    rect(ctx, ox+13, 23,  6, 1, '#3355aa');
    // Tail body
    rect(ctx, ox+14, 24,  4, 4, '#999');
    // Engine exhaust
    const ec = exhaustColors[fi];
    rect(ctx, ox+15, 28,  2, 2, ec);
    if (fi % 2 === 0) rect(ctx, ox+15, 30, 2, 2, ec);
    // US flag stripe on fuselage
    rect(ctx, ox+14, 14,  4, 1, '#cc2222');
    rect(ctx, ox+14, 15,  4, 1, '#ffffff');
  }
  save(c, 'aircraft.png');
}

// ─── SILO 32x32 per frame, 6 frames = 192x32 ────────────────────────────────
{
  const { c, ctx } = mk(192, 32);

  function bunker(ox, glowColor) {
    // Base
    rect(ctx, ox+4,  26, 24, 6, '#7a6345');
    rect(ctx, ox+6,  22, 20, 6, '#8B7355');
    rect(ctx, ox+8,  18, 16, 6, '#9B8365');
    rect(ctx, ox+10, 14, 12, 6, '#aa9070');
    // Highlights
    rect(ctx, ox+8,  22,  2, 4, '#aaa08a');
    rect(ctx, ox+22, 22,  2, 4, '#aaa08a');
    // Door seam
    rect(ctx, ox+14, 14,  2,12, '#554433');
    rect(ctx, ox+16, 14,  2,12, '#554433');
    if (glowColor) {
      rect(ctx, ox+13, 13,  6, 2, glowColor);
    }
  }

  // Frame 0: closed
  bunker(0, null);
  // Frame 1: opening
  bunker(32, '#ff6600');
  rect(ctx, 32+13, 10, 6, 6, '#ff440044');
  // Frame 2: open - missile tip visible
  bunker(64, '#ff4400');
  rect(ctx, 64+13, 3, 6, 13, '#cc3300');
  rect(ctx, 64+14, 2, 4, 2,  '#ffcc00');
  rect(ctx, 64+15, 1, 2, 1,  '#ffee44');
  // Frames 3-5: destruction
  const dColors = [['#ff6600','#cc3300'], ['#884422','#552211'], ['#555','#333']];
  dColors.forEach(([c1, c2], i) => {
    const ox = (3+i)*32;
    rect(ctx, ox+4,  26, 24, 6, c1);
    rect(ctx, ox+6,  22, 20, 5, c2);
    rect(ctx, ox+8,  18, 16, 4, c1);
    // Rubble chunks
    rect(ctx, ox+5,  16,  5, 3, '#888');
    rect(ctx, ox+20, 15,  6, 4, '#777');
    rect(ctx, ox+12, 14,  4, 2, '#999');
    if (i === 0) {
      rect(ctx, ox+10, 10, 4, 5, '#ff8800');
      rect(ctx, ox+17, 8,  4, 7, '#ff4400');
    }
  });
  save(c, 'silo.png');
}

// ─── BOMB 14x14 ─────────────────────────────────────────────────────────────
{
  const { c, ctx } = mk(14, 14);
  // Body
  rect(ctx, 5, 1, 4, 2, '#aaa');
  rect(ctx, 4, 3, 6, 5, '#888');
  rect(ctx, 5, 8, 4, 3, '#777');
  rect(ctx, 6,11, 2, 2, '#666');
  // Fins
  rect(ctx, 2, 3, 3, 2, '#bbb');
  rect(ctx, 9, 3, 3, 2, '#bbb');
  rect(ctx, 1, 5, 2, 2, '#999');
  rect(ctx, 11,5, 2, 2, '#999');
  // Nose cone
  rect(ctx, 5, 0, 4, 1, '#ccc');
  px(ctx, 6, 0, '#ddd'); px(ctx, 7, 0, '#ddd');
  save(c, 'bomb.png');
}

// ─── ENEMY MISSILE 14x22 per frame, 2 frames = 28x22 ────────────────────────
{
  const { c, ctx } = mk(28, 22);
  [[0,'#ff8800'],[14,'#ffcc00']].forEach(([ox, ex]) => {
    // Tip
    rect(ctx, ox+5, 0, 4, 2, '#ffcc00');
    rect(ctx, ox+6, 0, 2, 1, '#fff');
    // Body
    rect(ctx, ox+4, 2, 6, 12, '#cc2200');
    rect(ctx, ox+5, 2, 4, 12, '#ee3300');
    rect(ctx, ox+6, 2, 2, 12, '#ff4400');
    // Stripe
    rect(ctx, ox+4, 8, 6, 2, '#ffffff');
    // Fins
    rect(ctx, ox+2,13, 3, 4, '#aa1100');
    rect(ctx, ox+9,13, 3, 4, '#aa1100');
    rect(ctx, ox+3,17, 2, 2, '#881100');
    rect(ctx, ox+9,17, 2, 2, '#881100');
    // Exhaust
    rect(ctx, ox+5,16, 4, 3, ex);
    rect(ctx, ox+6,19, 2, 3, ex);
  });
  save(c, 'enemy_missile.png');
}

// ─── PLAYER MISSILE 10x16 per frame, 2 frames = 20x16 ───────────────────────
{
  const { c, ctx } = mk(20, 16);
  [[0,'#ff8800'],[10,'#ffcc00']].forEach(([ox, ex]) => {
    rect(ctx, ox+3, 0, 4, 2, '#ddeeff');
    rect(ctx, ox+3, 2, 4,10, '#aabbdd');
    rect(ctx, ox+4, 2, 2,10, '#8899cc');
    rect(ctx, ox+2,11, 2, 2, '#6677aa');
    rect(ctx, ox+6,11, 2, 2, '#6677aa');
    rect(ctx, ox+3,13, 4, 2, ex);
    rect(ctx, ox+4,15, 2, 1, ex);
  });
  save(c, 'aircraft_missile.png');
}

// ─── SHIP 64x24 per frame, 2 frames = 128x24 ────────────────────────────────
{
  const { c, ctx } = mk(128, 24);
  [[0,0],[64,1]].forEach(([ox, wv]) => {
    // Hull
    rect(ctx, ox+2,  16, 60, 6, '#444');
    rect(ctx, ox+3,  14, 58, 4, '#555');
    rect(ctx, ox+4,  12, 56, 4, '#666');
    // Bow
    rect(ctx, ox+1,  18,  2, 2, '#333');
    rect(ctx, ox+61, 18,  2, 2, '#333');
    // Waterline highlight
    rect(ctx, ox+4,  12, 56, 1, '#777');
    // Superstructure
    rect(ctx, ox+20,  8, 24, 6, '#888');
    rect(ctx, ox+24,  5, 16, 5, '#999');
    rect(ctx, ox+26,  3, 12, 4, '#aaa');
    // Bridge windows
    rect(ctx, ox+25,  6,  3, 2, '#66ccff');
    rect(ctx, ox+30,  6,  3, 2, '#66ccff');
    rect(ctx, ox+35,  6,  3, 2, '#66ccff');
    // Radar/antenna
    px(ctx, ox+31, 2, '#ccc');
    px(ctx, ox+32, 1, '#ccc');
    // Oil barrels on deck
    for (let bx = 6; bx < 19; bx += 4) {
      rect(ctx, ox+bx, 10, 3, 3, '#884400');
      rect(ctx, ox+bx, 10, 3, 1, '#aa5500');
    }
    for (let bx = 44; bx < 60; bx += 4) {
      rect(ctx, ox+bx, 10, 3, 3, '#884400');
      rect(ctx, ox+bx, 10, 3, 1, '#aa5500');
    }
    // Wake
    const wakeY = 20;
    if (wv === 0) {
      rect(ctx, ox+1, wakeY, 3, 1, 'rgba(255,255,255,0.5)');
      rect(ctx, ox+1, wakeY+2, 2, 1, 'rgba(255,255,255,0.3)');
    } else {
      rect(ctx, ox+2, wakeY+1, 3, 1, 'rgba(255,255,255,0.5)');
      rect(ctx, ox+1, wakeY, 2, 1, 'rgba(255,255,255,0.3)');
    }
  });
  save(c, 'ship.png');
}

// ─── EXPLOSION 32x32 per frame, 8 frames = 256x32 ───────────────────────────
{
  const { c, ctx } = mk(256, 32);
  const frames = [
    { r:4,  colors:['#ffffff','#ffff88'] },
    { r:8,  colors:['#ffffff','#ffee44','#ffaa00'] },
    { r:12, colors:['#ffee44','#ff8800','#ff4400'] },
    { r:14, colors:['#ff8800','#ff4400','#cc2200'] },
    { r:14, colors:['#ff4400','#cc2200','#882200'] },
    { r:11, colors:['#cc2200','#882200','#441100'] },
    { r:8,  colors:['#882200','#555','#333'] },
    { r:5,  colors:['#555','#333','#222'] },
  ];
  frames.forEach(({ r, colors }, fi) => {
    const cx = fi * 32 + 16, cy = 16;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d > r) continue;
        const t = d / r;
        const ci = Math.min(Math.floor(t * colors.length), colors.length-1);
        ctx.fillStyle = colors[ci];
        ctx.fillRect(cx+dx, cy+dy, 1, 1);
      }
    }
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

console.log('\nAll assets generated at 2× size!');

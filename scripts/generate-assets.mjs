/**
 * Pixel art asset generator for Hormuz Defender.
 * Run with: node scripts/generate-assets.mjs
 * Requires: npm install canvas (or use the pre-generated assets in public/assets/sprites/)
 *
 * Generates all game sprites as PNG files to public/assets/sprites/
 */

import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../public/assets/sprites');
mkdirSync(OUT, { recursive: true });

function savePNG(canvas, filename) {
  const buffer = canvas.toBuffer('image/png');
  writeFileSync(join(OUT, filename), buffer);
  console.log(`Generated: ${filename}`);
}

function mkCanvas(w, h) {
  const c = createCanvas(w, h);
  return { c, ctx: c.getContext('2d') };
}

// Helper: set pixel
function px(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

// ─── AIRCRAFT (16x16 per frame, 4 frames wide = 64x16) ───────────────────────
{
  const { c, ctx } = mkCanvas(64, 16);
  ctx.clearRect(0, 0, 64, 16);

  const frames = [0, 16, 32, 48];
  frames.forEach((ox, fi) => {
    // Body (fuselage) - dark gray
    for (let x = 5; x <= 10; x++) px(ctx, ox + x, 7, '#888');
    for (let x = 6; x <= 9; x++) px(ctx, ox + x, 6, '#aaa');
    for (let x = 7; x <= 8; x++) px(ctx, ox + x, 5, '#ccc');
    // Nose
    px(ctx, ox + 11, 7, '#aaa');
    px(ctx, ox + 12, 7, '#ccc');
    // Tail
    px(ctx, ox + 4, 7, '#666');
    // Wings
    for (let x = 6; x <= 9; x++) {
      px(ctx, ox + x, 5, '#5577aa');
      px(ctx, ox + x, 9, '#5577aa');
    }
    px(ctx, ox + 5, 4, '#4466aa');
    px(ctx, ox + 10, 4, '#4466aa');
    px(ctx, ox + 5, 10, '#4466aa');
    px(ctx, ox + 10, 10, '#4466aa');
    // Cockpit
    px(ctx, ox + 9, 6, '#88ddff');
    px(ctx, ox + 10, 6, '#88ddff');
    // Engine exhaust (varies per frame)
    const exhaustColors = ['#ff8800', '#ffaa00', '#ff6600', '#ffcc00'];
    px(ctx, ox + 3, 7, exhaustColors[fi]);
    px(ctx, ox + 2, 7, fi % 2 === 0 ? exhaustColors[fi] : 'transparent');
  });

  savePNG(c, 'aircraft.png');
}

// ─── SILO (16x16 per frame, 6 frames = 96x16) ────────────────────────────────
{
  const { c, ctx } = mkCanvas(96, 16);
  ctx.clearRect(0, 0, 96, 16);

  // Frame 0: Closed bunker
  function drawBunker(ox) {
    for (let x = 3; x <= 12; x++) {
      px(ctx, ox + x, 12, '#8B7355');
      px(ctx, ox + x, 11, '#9B8365');
    }
    for (let x = 4; x <= 11; x++) {
      px(ctx, ox + x, 10, '#9B8365');
      px(ctx, ox + x, 9, '#aa9070');
    }
    for (let x = 5; x <= 10; x++) px(ctx, ox + x, 8, '#aa9070');
    // Door seam
    px(ctx, ox + 7, 9, '#555');
    px(ctx, ox + 8, 9, '#555');
    px(ctx, ox + 7, 10, '#555');
    px(ctx, ox + 8, 10, '#555');
  }

  // Frame 0: closed
  drawBunker(0);

  // Frame 1: door opening (orange glow)
  drawBunker(16);
  px(ctx, 16 + 7, 8, '#ff6600');
  px(ctx, 16 + 8, 8, '#ff8800');

  // Frame 2: open, missile tip visible
  drawBunker(32);
  for (let y = 5; y <= 8; y++) {
    px(ctx, 32 + 7, y, '#ff4400');
    px(ctx, 32 + 8, y, '#cc3300');
  }
  px(ctx, 32 + 7, 4, '#ffcc00');
  px(ctx, 32 + 8, 4, '#ffcc00');

  // Frame 3-5: destruction
  const destroyColors = [['#ff6600', '#cc3300'], ['#884422', '#664411'], ['#444', '#333']];
  destroyColors.forEach(([c1, c2], i) => {
    const ox = (3 + i) * 16;
    for (let x = 3; x <= 12; x++) px(ctx, ox + x, 12, c1);
    for (let x = 4; x <= 11; x++) px(ctx, ox + x, 11, c2);
    // rubble pixels
    px(ctx, ox + 5, 10, c1);
    px(ctx, ox + 9, 10, c1);
    px(ctx, ox + 6, 9, '#888');
  });

  savePNG(c, 'silo.png');
}

// ─── BOMB (8x8 single sprite) ────────────────────────────────────────────────
{
  const { c, ctx } = mkCanvas(8, 8);
  ctx.clearRect(0, 0, 8, 8);
  // Teardrop shape
  px(ctx, 3, 1, '#888');
  px(ctx, 4, 1, '#888');
  for (let x = 2; x <= 5; x++) px(ctx, x, 2, '#777');
  for (let x = 2; x <= 5; x++) px(ctx, x, 3, '#666');
  for (let x = 2; x <= 5; x++) px(ctx, x, 4, '#666');
  for (let x = 3; x <= 4; x++) px(ctx, x, 5, '#555');
  px(ctx, 3, 6, '#444');
  // Fins
  px(ctx, 1, 2, '#aaa');
  px(ctx, 6, 2, '#aaa');
  savePNG(c, 'bomb.png');
}

// ─── ENEMY MISSILE (8x12, 2 frames = 16x12) ──────────────────────────────────
{
  const { c, ctx } = mkCanvas(16, 12);
  ctx.clearRect(0, 0, 16, 12);

  function drawEMissile(ox, exhaustColor) {
    // Tip
    px(ctx, ox + 3, 0, '#ffcc00');
    px(ctx, ox + 4, 0, '#ffcc00');
    // Body
    for (let y = 1; y <= 7; y++) {
      px(ctx, ox + 2, y, '#cc2200');
      px(ctx, ox + 3, y, '#ee3300');
      px(ctx, ox + 4, y, '#ee3300');
      px(ctx, ox + 5, y, '#cc2200');
    }
    // Red stripe
    px(ctx, ox + 2, 4, '#fff');
    px(ctx, ox + 5, 4, '#fff');
    // Fins
    px(ctx, ox + 1, 7, '#aa1100');
    px(ctx, ox + 6, 7, '#aa1100');
    px(ctx, ox + 1, 8, '#aa1100');
    px(ctx, ox + 6, 8, '#aa1100');
    // Exhaust
    px(ctx, ox + 3, 9, exhaustColor);
    px(ctx, ox + 4, 9, exhaustColor);
    px(ctx, ox + 3, 10, exhaustColor);
    px(ctx, ox + 4, 10, exhaustColor);
  }

  drawEMissile(0, '#ff8800');
  drawEMissile(8, '#ffcc00');
  savePNG(c, 'enemy_missile.png');
}

// ─── PLAYER MISSILE (8x8, 2 frames = 16x8) ───────────────────────────────────
{
  const { c, ctx } = mkCanvas(16, 8);
  ctx.clearRect(0, 0, 16, 8);

  function drawPMissile(ox, ex) {
    px(ctx, ox + 3, 0, '#ccddff');
    px(ctx, ox + 4, 0, '#ccddff');
    for (let y = 1; y <= 5; y++) {
      px(ctx, ox + 3, y, '#aabbee');
      px(ctx, ox + 4, y, '#8899cc');
    }
    px(ctx, ox + 2, 5, '#6677aa');
    px(ctx, ox + 5, 5, '#6677aa');
    px(ctx, ox + 3, 6, ex);
    px(ctx, ox + 4, 6, ex);
  }

  drawPMissile(0, '#ff8800');
  drawPMissile(8, '#ffcc00');
  savePNG(c, 'aircraft_missile.png');
}

// ─── SHIP (32x16, 2 frames = 64x16) ──────────────────────────────────────────
{
  const { c, ctx } = mkCanvas(64, 16);
  ctx.clearRect(0, 0, 64, 16);

  function drawShip(ox, wakeVariant) {
    // Hull
    for (let x = 2; x <= 29; x++) px(ctx, ox + x, 10, '#555');
    for (let x = 3; x <= 28; x++) px(ctx, ox + x, 9, '#666');
    for (let x = 4; x <= 27; x++) px(ctx, ox + x, 8, '#777');
    // Superstructure
    for (let x = 10; x <= 20; x++) px(ctx, ox + x, 7, '#888');
    for (let x = 12; x <= 18; x++) px(ctx, ox + x, 6, '#999');
    for (let x = 13; x <= 17; x++) px(ctx, ox + x, 5, '#aaa');
    // Bridge windows
    px(ctx, ox + 14, 6, '#88ddff');
    px(ctx, ox + 16, 6, '#88ddff');
    // Bow
    px(ctx, ox + 1, 10, '#444');
    px(ctx, ox + 30, 10, '#444');
    // Wake (stern)
    const wakePixels = wakeVariant === 0
      ? [[1,11],[2,11],[1,12],[3,12]]
      : [[2,11],[1,12],[2,12],[3,11]];
    wakePixels.forEach(([wx, wy]) => px(ctx, ox + wx, wy, 'rgba(255,255,255,0.6)'));
    // Oil barrel markings on deck
    for (let x = 5; x <= 9; x += 2) {
      px(ctx, ox + x, 8, '#884400');
    }
  }

  drawShip(0, 0);
  drawShip(32, 1);
  savePNG(c, 'ship.png');
}

// ─── EXPLOSION (16x16, 8 frames = 128x16) ────────────────────────────────────
{
  const { c, ctx } = mkCanvas(128, 16);
  ctx.clearRect(0, 0, 128, 16);

  const explFrames = [
    { r: 3, colors: ['#ffffff', '#ffff00'] },
    { r: 5, colors: ['#ffffff', '#ffcc00', '#ff8800'] },
    { r: 6, colors: ['#ffcc00', '#ff8800', '#ff4400'] },
    { r: 7, colors: ['#ff8800', '#ff4400', '#cc2200'] },
    { r: 6, colors: ['#ff4400', '#cc2200', '#882200'] },
    { r: 5, colors: ['#cc2200', '#882200', '#441100'] },
    { r: 4, colors: ['#882200', '#444444', '#333333'] },
    { r: 3, colors: ['#444444', '#333333', '#222222'] }
  ];

  explFrames.forEach(({ r, colors }, fi) => {
    const cx = fi * 16 + 8;
    const cy = 8;
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (dist <= r) {
          const t = dist / r;
          const ci = Math.floor(t * colors.length);
          px(ctx, x, y, colors[Math.min(ci, colors.length - 1)]);
        }
      }
    }
  });

  savePNG(c, 'explosion.png');
}

// ─── OIL SLICK (16x8, 4 frames = 64x8) ──────────────────────────────────────
{
  const { c, ctx } = mkCanvas(64, 8);
  ctx.clearRect(0, 0, 64, 8);

  [2, 4, 6, 8].forEach((r, fi) => {
    const cx = fi * 16 + 8;
    const cy = 4;
    for (let y = cy - Math.ceil(r * 0.5); y <= cy + Math.ceil(r * 0.5); y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        const dist = Math.sqrt(((x - cx) / 2) ** 2 + (y - cy) ** 2);
        if (dist <= r * 0.5) {
          // Rainbow sheen on oil
          const hue = ((x - (cx - r)) / (r * 2) * 60 + 180) % 360;
          ctx.fillStyle = `hsla(${hue}, 80%, 25%, 0.9)`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  });

  savePNG(c, 'oil_slick.png');
}

// ─── TERRAIN TILESET (16x16 per tile, 8 tiles = 128x16) ──────────────────────
{
  const { c, ctx } = mkCanvas(128, 16);
  ctx.clearRect(0, 0, 128, 16);

  // Tile 0: Deep water
  {
    const ox = 0;
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++)
        px(ctx, ox + x, y, (x + y) % 4 === 0 ? '#1a3a6a' : '#1a3058');
    px(ctx, ox + 4, 2, '#2244aa');
    px(ctx, ox + 11, 8, '#2244aa');
  }

  // Tile 1: Shallow water
  {
    const ox = 16;
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++)
        px(ctx, ox + x, y, (x + y) % 3 === 0 ? '#2255aa' : '#1e4a88');
  }

  // Tile 2: Sand/coast
  {
    const ox = 32;
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++)
        px(ctx, ox + x, y, (x * y) % 5 === 0 ? '#d4b483' : '#c4a472');
    // Edge darkening (bottom = water side)
    for (let x = 0; x < 16; x++) px(ctx, ox + x, 15, '#a08040');
  }

  // Tile 3: Rock
  {
    const ox = 48;
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++)
        px(ctx, ox + x, y, (x + y * 2) % 4 === 0 ? '#888' : '#666');
    // Jagged highlights
    [2, 5, 9, 13].forEach(x => px(ctx, ox + x, 0, '#aaa'));
  }

  // Tile 4: City block
  {
    const ox = 64;
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++)
        px(ctx, ox + x, y, '#c8b89a');
    // Building
    for (let y = 3; y <= 12; y++)
      for (let x = 2; x <= 13; x++)
        px(ctx, ox + x, y, '#aa9978');
    // Windows
    [[3,4],[6,4],[9,4],[3,8],[6,8],[9,8]].forEach(([wx,wy]) => {
      px(ctx, ox + wx, wy, '#88ddff');
      px(ctx, ox + wx + 1, wy, '#88ddff');
    });
    // Road line at bottom
    for (let x = 0; x < 16; x++) px(ctx, ox + x, 15, '#888');
  }

  // Tile 5: City damaged
  {
    const ox = 80;
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++)
        px(ctx, ox + x, y, '#c8b89a');
    for (let y = 3; y <= 12; y++)
      for (let x = 2; x <= 13; x++)
        px(ctx, ox + x, y, '#886644');
    // Cracks
    [4,6,8,10].forEach(y => px(ctx, ox + 7, y, '#333'));
    // Scorch
    for (let x = 4; x <= 8; x++) px(ctx, ox + x, 12, '#222');
    px(ctx, ox + 5, 11, '#333');
    px(ctx, ox + 7, 11, '#333');
  }

  // Tile 6: Desert
  {
    const ox = 96;
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++)
        px(ctx, ox + x, y, (x * 3 + y) % 7 === 0 ? '#e8c878' : '#d4b460');
  }

  // Tile 7: Road
  {
    const ox = 112;
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++)
        px(ctx, ox + x, y, '#666');
    // Lane markings
    for (let y = 0; y < 16; y += 4) {
      px(ctx, ox + 7, y, '#ffff00');
      px(ctx, ox + 8, y, '#ffff00');
    }
  }

  savePNG(c, 'terrain.png');
}

// ─── UI SPRITESHEET (various UI elements, 128x32) ────────────────────────────
{
  const { c, ctx } = mkCanvas(128, 32);
  ctx.clearRect(0, 0, 128, 32);

  // Timer bar segments (1x8 each, colors: red/yellow/green) at y=0
  // Red (0-10%)
  for (let x = 0; x < 10; x++) {
    for (let y = 0; y < 8; y++) px(ctx, x, y, '#cc2200');
  }
  // Yellow (10-50%)
  for (let x = 10; x < 50; x++) {
    for (let y = 0; y < 8; y++) px(ctx, x, y, '#ddaa00');
  }
  // Green (50-100%)
  for (let x = 50; x < 128; x++) {
    for (let y = 0; y < 8; y++) px(ctx, x, y, '#22aa22');
  }

  // Life icon (aircraft silhouette 8x8) at y=8
  px(ctx, 4, 9, '#aaa');
  px(ctx, 3, 10, '#aaa'); px(ctx, 4, 10, '#ccc'); px(ctx, 5, 10, '#aaa');
  px(ctx, 2, 11, '#6688aa'); px(ctx, 3, 11, '#aaa'); px(ctx, 4, 11, '#ccc'); px(ctx, 5, 11, '#aaa'); px(ctx, 6, 11, '#6688aa');
  px(ctx, 3, 12, '#888'); px(ctx, 4, 12, '#aaa'); px(ctx, 5, 12, '#888');
  px(ctx, 3, 13, '#ff8800');

  // Bomb icon 8x8 at x=16, y=8
  px(ctx, 19, 9, '#888');
  for (let x = 18; x <= 21; x++) px(ctx, x, 10, '#777');
  for (let x = 18; x <= 21; x++) px(ctx, x, 11, '#666');
  for (let x = 18; x <= 21; x++) px(ctx, x, 12, '#666');
  px(ctx, 19, 13, '#555');
  px(ctx, 20, 13, '#555');

  // Oil barrel icon 8x8 at x=24, y=8
  for (let y = 9; y <= 14; y++) {
    px(ctx, 24, y, '#884400');
    px(ctx, 31, y, '#884400');
  }
  for (let x = 25; x <= 30; x++) {
    px(ctx, x, 9, '#aa5500');
    px(ctx, x, 14, '#aa5500');
  }
  for (let x = 25; x <= 30; x++) px(ctx, x, 11, '#cc6600');
  px(ctx, 25, 10, '#cc6600'); px(ctx, 30, 10, '#cc6600');
  px(ctx, 25, 12, '#cc6600'); px(ctx, 30, 12, '#cc6600');

  // Missile icon 8x8 at x=32, y=8
  px(ctx, 35, 8, '#ccddff');
  px(ctx, 36, 8, '#ccddff');
  for (let y = 9; y <= 13; y++) {
    px(ctx, 35, y, '#aabbee');
    px(ctx, 36, y, '#8899cc');
  }
  px(ctx, 34, 13, '#6677aa');
  px(ctx, 37, 13, '#6677aa');
  px(ctx, 35, 14, '#ff8800');
  px(ctx, 36, 14, '#ff8800');

  savePNG(c, 'ui.png');
}

// ─── TARGET RETICLE (16x16) ──────────────────────────────────────────────────
{
  const { c, ctx } = mkCanvas(16, 16);
  ctx.clearRect(0, 0, 16, 16);
  // Four corner brackets
  // Top-left
  for (let i = 0; i < 5; i++) px(ctx, i, 0, '#ff4444');
  for (let i = 0; i < 5; i++) px(ctx, 0, i, '#ff4444');
  // Top-right
  for (let i = 11; i < 16; i++) px(ctx, i, 0, '#ff4444');
  for (let i = 0; i < 5; i++) px(ctx, 15, i, '#ff4444');
  // Bottom-left
  for (let i = 0; i < 5; i++) px(ctx, i, 15, '#ff4444');
  for (let i = 11; i < 16; i++) px(ctx, 0, i, '#ff4444');
  // Bottom-right
  for (let i = 11; i < 16; i++) px(ctx, i, 15, '#ff4444');
  for (let i = 11; i < 16; i++) px(ctx, 15, i, '#ff4444');
  // Center dot
  px(ctx, 7, 7, '#ff4444');
  px(ctx, 8, 7, '#ff4444');
  px(ctx, 7, 8, '#ff4444');
  px(ctx, 8, 8, '#ff4444');
  savePNG(c, 'reticle.png');
}

// ─── MOVE INDICATOR (8x8) ────────────────────────────────────────────────────
{
  const { c, ctx } = mkCanvas(8, 8);
  ctx.clearRect(0, 0, 8, 8);
  // Cross
  for (let i = 0; i < 8; i++) px(ctx, i, 3, '#ffff00');
  for (let i = 0; i < 8; i++) px(ctx, i, 4, '#ffff00');
  for (let i = 0; i < 8; i++) px(ctx, 3, i, '#ffff00');
  for (let i = 0; i < 8; i++) px(ctx, 4, i, '#ffff00');
  savePNG(c, 'move_indicator.png');
}

console.log('\nAll assets generated successfully!');

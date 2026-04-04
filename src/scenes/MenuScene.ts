import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { DIFFICULTIES, Difficulty } from '../config/BalanceConfig';

const DIFF_OPTS: { key: Difficulty; label: string; color: string; desc: string }[] = [
  { key: 'recruit',   label: 'RECRUIT',   color: '#44ff88', desc: 'Easy — long timers' },
  { key: 'sergeant',  label: 'SERGEANT',  color: '#ffee44', desc: 'Normal — balanced' },
  { key: 'commander', label: 'COMMANDER', color: '#ff8833', desc: 'Hard — fast silos' },
  { key: 'admiral',   label: 'ADMIRAL',   color: '#ff2222', desc: 'Extreme — brutal' },
];

export class MenuScene extends Phaser.Scene {
  private selectedDiff: Difficulty = 'sergeant';
  private diffBtnGfx: Phaser.GameObjects.Graphics[] = [];

  constructor() { super({ key: 'MenuScene' }); }

  create(): void {
    // Read saved difficulty if any
    const saved = this.registry.get('difficulty') as Difficulty | undefined;
    if (saved) this.selectedDiff = saved;

    // ── Background ────────────────────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x02040e, 0x02040e, 0x060c22, 0x060c22, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Stars
    const stars = this.add.graphics();
    for (let i = 0; i < 80; i++) {
      const sx = (i * 137 + 23) % GAME_WIDTH;
      const sy = (i * 97  + 11) % (GAME_HEIGHT * 0.55);
      stars.fillStyle(0xffffff, 0.15 + (i % 6) * 0.1);
      stars.fillRect(sx, sy, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
    }
    const twinkle = this.add.graphics();
    for (let i = 0; i < 16; i++) {
      const sx = (i * 211 + 50) % GAME_WIDTH;
      const sy = (i * 153 + 17) % (GAME_HEIGHT * 0.5);
      twinkle.fillStyle(0xaaddff, 0.8); twinkle.fillRect(sx, sy, 2, 2);
    }
    this.tweens.add({ targets: twinkle, alpha: 0.1, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Sea horizon
    const sea = this.add.graphics();
    sea.fillGradientStyle(0x0a1835, 0x0a1835, 0x1a3868, 0x1a3868, 0.85);
    sea.fillRect(0, GAME_HEIGHT * 0.56, GAME_WIDTH, GAME_HEIGHT * 0.44);

    // ── Flag stripe ───────────────────────────────────────────────────────
    this.add.rectangle(0, 0, GAME_WIDTH, 6, 0xcc1111).setOrigin(0, 0);
    this.add.rectangle(0, 6, GAME_WIDTH, 6, 0xffffff).setOrigin(0, 0);
    this.add.rectangle(0, 12, GAME_WIDTH, 6, 0x1133cc).setOrigin(0, 0);

    // ── Title glow ────────────────────────────────────────────────────────
    const halo = this.add.graphics();
    halo.fillStyle(0xff2200, 0.07); halo.fillEllipse(GAME_WIDTH / 2, 72, 220, 78);
    halo.fillStyle(0xff4400, 0.1);  halo.fillEllipse(GAME_WIDTH / 2, 72, 148, 52);

    this.add.text(GAME_WIDTH / 2, 52, 'HORMUZ', {
      fontSize: '30px', color: '#ff3322', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#220000', strokeThickness: 7,
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 88, 'DEFENDER', {
      fontSize: '18px', color: '#ffcc00', fontFamily: 'monospace',
      stroke: '#221100', strokeThickness: 4,
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 112, 'Protect the strait. Secure the oil.', {
      fontSize: '8px', color: '#5577aa', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Divider
    const div = this.add.graphics();
    div.lineStyle(1, 0x224466, 0.7);
    div.lineBetween(16, 124, GAME_WIDTH - 16, 124);
    div.fillStyle(0x3388cc, 1);
    for (const dx of [16, GAME_WIDTH / 2, GAME_WIDTH - 16]) div.fillRect(dx - 2, 122, 4, 4);

    // ── MISSION BRIEFING card ─────────────────────────────────────────────
    const card1 = this.add.graphics();
    card1.fillStyle(0x07101c, 0.82);
    card1.fillRoundedRect(12, 130, GAME_WIDTH - 24, 76, 7);
    card1.lineStyle(1.5, 0x1a3355, 0.8);
    card1.strokeRoundedRect(12, 130, GAME_WIDTH - 24, 76, 7);

    this.add.text(GAME_WIDTH / 2, 140, 'MISSION BRIEFING', {
      fontSize: '10px', color: '#ffcc44', fontFamily: 'monospace',
      stroke: '#110800', strokeThickness: 3,
    }).setOrigin(0.5);

    [
      '💣  Bomb silos before they fire',
      '🚢  Protect oil tankers in the strait',
      '🏙  Defend Gulf cities from missiles',
    ].forEach((l, i) => {
      this.add.text(22, 154 + i * 18, l, {
        fontSize: '8px', color: '#88ccaa', fontFamily: 'monospace',
        stroke: '#010a05', strokeThickness: 2,
      });
    });

    // ── DIFFICULTY section ────────────────────────────────────────────────
    const diffY = 216;
    const diffCard = this.add.graphics();
    diffCard.fillStyle(0x060e18, 0.75);
    diffCard.fillRoundedRect(12, diffY, GAME_WIDTH - 24, 128, 7);
    diffCard.lineStyle(1.5, 0x1a2d44, 0.8);
    diffCard.strokeRoundedRect(12, diffY, GAME_WIDTH - 24, 128, 7);

    this.add.text(GAME_WIDTH / 2, diffY + 10, 'DIFFICULTY', {
      fontSize: '10px', color: '#ffcc44', fontFamily: 'monospace',
      stroke: '#110800', strokeThickness: 3,
    }).setOrigin(0.5);

    this.buildDifficultyButtons(diffY + 26);

    // ── START button ──────────────────────────────────────────────────────
    const startY = 362;
    const startGfx = this.add.graphics();
    const drawStart = (hover: boolean) => {
      startGfx.clear();
      startGfx.fillStyle(0x44ff44, hover ? 0.22 : 0.1);
      startGfx.fillRoundedRect(GAME_WIDTH / 2 - 96, startY - 22, 192, 44, 12);
      startGfx.fillGradientStyle(
        hover ? 0x226622 : 0x163316, hover ? 0x226622 : 0x163316,
        hover ? 0x2d7a2d : 0x1e4a1e, hover ? 0x2d7a2d : 0x1e4a1e, 1);
      startGfx.fillRoundedRect(GAME_WIDTH / 2 - 94, startY - 20, 188, 40, 10);
      startGfx.fillStyle(0xffffff, 0.1);
      startGfx.fillRoundedRect(GAME_WIDTH / 2 - 92, startY - 19, 184, 18, 9);
      startGfx.lineStyle(2.5, 0x44ff44, 0.95);
      startGfx.strokeRoundedRect(GAME_WIDTH / 2 - 94, startY - 20, 188, 40, 10);
    };
    drawStart(false);
    this.add.text(GAME_WIDTH / 2, startY, '▶   START MISSION', {
      fontSize: '12px', color: '#55ff55', fontFamily: 'monospace',
      stroke: '#001100', strokeThickness: 4,
    }).setOrigin(0.5);
    const startHit = this.add.rectangle(GAME_WIDTH / 2, startY, 188, 40, 0, 0).setInteractive();
    startHit.on('pointerover',  () => drawStart(true));
    startHit.on('pointerout',   () => drawStart(false));
    startHit.on('pointerdown',  () => {
      this.registry.set('difficulty', this.selectedDiff);
      this.tweens.add({ targets: startHit, scaleX: 0.94, scaleY: 0.94, duration: 60, yoyo: true,
        onComplete: () => this.scene.start('GameScene') });
    });

    // ── LEADERBOARD button ────────────────────────────────────────────────
    const lbY = 414;
    const lbGfx = this.add.graphics();
    const drawLb = (hover: boolean) => {
      lbGfx.clear();
      lbGfx.fillStyle(hover ? 0x1a1a0a : 0x0e0e06, 0.9);
      lbGfx.fillRoundedRect(GAME_WIDTH / 2 - 80, lbY - 16, 160, 32, 8);
      lbGfx.lineStyle(2, 0xaaaa22, hover ? 0.8 : 0.5);
      lbGfx.strokeRoundedRect(GAME_WIDTH / 2 - 80, lbY - 16, 160, 32, 8);
    };
    drawLb(false);
    this.add.text(GAME_WIDTH / 2, lbY, '🏆  LEADERBOARD', {
      fontSize: '9px', color: '#ddcc44', fontFamily: 'monospace',
      stroke: '#0a0a00', strokeThickness: 3,
    }).setOrigin(0.5);
    const lbHit = this.add.rectangle(GAME_WIDTH / 2, lbY, 160, 32, 0, 0).setInteractive();
    lbHit.on('pointerover',  () => drawLb(true));
    lbHit.on('pointerout',   () => drawLb(false));
    lbHit.on('pointerdown',  () => {
      this.tweens.add({ targets: lbHit, scaleX: 0.94, scaleY: 0.94, duration: 60, yoyo: true,
        onComplete: () => this.scene.start('LeaderboardScene') });
    });

    // ── Blink hint ────────────────────────────────────────────────────────
    const blink = this.add.text(GAME_WIDTH / 2, 454, '— TAP ANYWHERE TO BEGIN —', {
      fontSize: '7px', color: '#2a4433', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.tweens.add({ targets: blink, alpha: 0.15, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.input.once('pointerdown', () => {
      this.registry.set('difficulty', this.selectedDiff);
      this.scene.start('GameScene');
    });
  }

  private buildDifficultyButtons(baseY: number): void {
    const BW = (GAME_WIDTH - 24 - 6) / 2;  // two per row
    const BH = 44;
    const gap = 6;
    const x0  = 14;

    this.diffBtnGfx = [];

    DIFF_OPTS.forEach((opt, i) => {
      const col  = i % 2;
      const row  = Math.floor(i / 2);
      const bx   = x0 + col * (BW + gap);
      const by   = baseY + row * (BH + gap);
      const gfx  = this.add.graphics();
      this.diffBtnGfx.push(gfx);

      const draw = (selected: boolean) => {
        gfx.clear();
        const hexColor = parseInt(opt.color.replace('#', ''), 16);
        if (selected) {
          gfx.fillStyle(hexColor, 0.18);
          gfx.fillRoundedRect(bx - 2, by - 2, BW + 4, BH + 4, 8);
          gfx.fillStyle(0x0d1e30, 0.97);
          gfx.fillRoundedRect(bx, by, BW, BH, 7);
          gfx.lineStyle(2.5, hexColor, 1.0);
          gfx.strokeRoundedRect(bx, by, BW, BH, 7);
          // top gloss
          gfx.fillStyle(0xffffff, 0.1);
          gfx.fillRoundedRect(bx + 2, by + 2, BW - 4, BH / 2 - 2, 6);
        } else {
          gfx.fillStyle(0x050c18, 0.88);
          gfx.fillRoundedRect(bx, by, BW, BH, 7);
          gfx.lineStyle(1.5, hexColor, 0.35);
          gfx.strokeRoundedRect(bx, by, BW, BH, 7);
        }
      };
      draw(this.selectedDiff === opt.key);

      const cx = bx + BW / 2;
      const labelText = this.add.text(cx, by + 14, opt.label, {
        fontSize: '9px', color: opt.color, fontFamily: 'monospace',
        stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5);
      const descText = this.add.text(cx, by + 28, opt.desc, {
        fontSize: '6px', color: '#667788', fontFamily: 'monospace',
      }).setOrigin(0.5);

      const hit = this.add.rectangle(bx + BW / 2, by + BH / 2, BW, BH, 0, 0).setInteractive();
      hit.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
        ptr.event.stopPropagation();
        this.selectedDiff = opt.key;
        this.registry.set('difficulty', opt.key);
        // Redraw all buttons
        DIFF_OPTS.forEach((o2, j) => {
          const g2 = this.diffBtnGfx[j];
          const sel = o2.key === opt.key;
          const hc2 = parseInt(o2.color.replace('#', ''), 16);
          g2.clear();
          const bx2 = x0 + (j % 2) * (BW + gap);
          const by2 = baseY + Math.floor(j / 2) * (BH + gap);
          if (sel) {
            g2.fillStyle(hc2, 0.18);
            g2.fillRoundedRect(bx2 - 2, by2 - 2, BW + 4, BH + 4, 8);
            g2.fillStyle(0x0d1e30, 0.97);
            g2.fillRoundedRect(bx2, by2, BW, BH, 7);
            g2.lineStyle(2.5, hc2, 1.0);
            g2.strokeRoundedRect(bx2, by2, BW, BH, 7);
            g2.fillStyle(0xffffff, 0.1);
            g2.fillRoundedRect(bx2 + 2, by2 + 2, BW - 4, BH / 2 - 2, 6);
          } else {
            g2.fillStyle(0x050c18, 0.88);
            g2.fillRoundedRect(bx2, by2, BW, BH, 7);
            g2.lineStyle(1.5, hc2, 0.35);
            g2.strokeRoundedRect(bx2, by2, BW, BH, 7);
          }
        });
      });

      // suppress tap-anywhere from firing when tapping difficulty
      void labelText; void descText;
    });
  }
}

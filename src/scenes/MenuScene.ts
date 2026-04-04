import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';

export class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create(): void {
    // ── Starfield sky background ──────────────────────────────────────────
    const bgGfx = this.add.graphics();
    bgGfx.fillGradientStyle(0x02040e, 0x02040e, 0x060c22, 0x060c22, 1);
    bgGfx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Stars (pseudo-random but deterministic)
    const starGfx = this.add.graphics();
    for (let i = 0; i < 90; i++) {
      const sx  = ((i * 137 + 23) % GAME_WIDTH);
      const sy  = ((i * 97  + 11) % (GAME_HEIGHT * 0.65));
      const sz  = i % 5 === 0 ? 1.5 : 1;
      const bri = 0.2 + (i % 7) * 0.1;
      starGfx.fillStyle(0xffffff, bri);
      starGfx.fillRect(sx, sy, sz, sz);
    }
    // Twinkling effect on a subset
    const twinkleStars = this.add.graphics();
    for (let i = 0; i < 18; i++) {
      const sx = ((i * 211 + 50) % GAME_WIDTH);
      const sy = ((i * 153 + 17) % (GAME_HEIGHT * 0.55));
      twinkleStars.fillStyle(0xaaddff, 0.7);
      twinkleStars.fillRect(sx, sy, 2, 2);
    }
    this.tweens.add({ targets: twinkleStars, alpha: 0.15, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // ── Ocean horizon (lower half) ────────────────────────────────────────
    const seaGfx = this.add.graphics();
    seaGfx.fillGradientStyle(0x0a1835, 0x0a1835, 0x1a3868, 0x1a3868, 0.9);
    seaGfx.fillRect(0, GAME_HEIGHT * 0.55, GAME_WIDTH, GAME_HEIGHT * 0.45);
    // Wave lines
    for (let wi = 0; wi < 8; wi++) {
      const wy = GAME_HEIGHT * 0.57 + wi * 18;
      seaGfx.lineStyle(1, 0x3366aa, 0.08 + wi * 0.015);
      seaGfx.lineBetween(0, wy, GAME_WIDTH, wy);
    }

    // ── US flag bar ───────────────────────────────────────────────────────
    this.add.rectangle(0, 0, GAME_WIDTH, 5, 0xcc1111).setOrigin(0, 0);
    this.add.rectangle(0, 5, GAME_WIDTH, 5, 0xffffff).setOrigin(0, 0);
    this.add.rectangle(0, 10, GAME_WIDTH, 5, 0x1133cc).setOrigin(0, 0);

    // ── Glow halo behind title ────────────────────────────────────────────
    const haloGfx = this.add.graphics();
    const hg = haloGfx;
    hg.fillStyle(0xff2200, 0.06);
    hg.fillEllipse(GAME_WIDTH / 2, 72, 200, 70);
    hg.fillStyle(0xff4400, 0.08);
    hg.fillEllipse(GAME_WIDTH / 2, 72, 150, 52);

    // ── HORMUZ title ──────────────────────────────────────────────────────
    this.add.text(GAME_WIDTH / 2, 52, 'HORMUZ', {
      fontSize: '30px', color: '#ff3322', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#220000', strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 86, 'DEFENDER', {
      fontSize: '18px', color: '#ffcc00', fontFamily: 'monospace',
      stroke: '#221100', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 108, 'Protect the strait. Secure the oil.', {
      fontSize: '5px', color: '#6688aa', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // ── Divider line with dots ────────────────────────────────────────────
    const divGfx = this.add.graphics();
    divGfx.lineStyle(1, 0x224466, 0.8);
    divGfx.lineBetween(16, 120, GAME_WIDTH - 16, 120);
    divGfx.fillStyle(0x3388cc, 0.9);
    for (const dx of [16, GAME_WIDTH / 2, GAME_WIDTH - 16]) {
      divGfx.fillRect(dx - 1, 119, 3, 3);
    }

    // ── Mission briefing card ─────────────────────────────────────────────
    const cardGfx = this.add.graphics();
    cardGfx.fillStyle(0x08121e, 0.75);
    cardGfx.fillRoundedRect(12, 128, GAME_WIDTH - 24, 80, 6);
    cardGfx.lineStyle(1, 0x1a3355, 0.8);
    cardGfx.strokeRoundedRect(12, 128, GAME_WIDTH - 24, 80, 6);

    this.add.text(GAME_WIDTH / 2, 136, 'MISSION BRIEFING', {
      fontSize: '6px', color: '#ffcc44', fontFamily: 'monospace',
      stroke: '#110800', strokeThickness: 2,
    }).setOrigin(0.5);

    const briefLines = [
      '💣 Bomb silos before they fire',
      '🚢 Protect oil tankers in the strait',
      '🏙 Defend Gulf cities from missiles',
    ];
    briefLines.forEach((l, i) => {
      this.add.text(24, 150 + i * 14, l, {
        fontSize: '5px', color: '#99ccaa', fontFamily: 'monospace',
      });
    });

    // ── Controls card ─────────────────────────────────────────────────────
    const ctrl = this.add.graphics();
    ctrl.fillStyle(0x050e18, 0.7);
    ctrl.fillRoundedRect(12, 216, GAME_WIDTH - 24, 68, 6);
    ctrl.lineStyle(1, 0x1a3355, 0.7);
    ctrl.strokeRoundedRect(12, 216, GAME_WIDTH - 24, 68, 6);

    this.add.text(GAME_WIDTH / 2, 224, 'CONTROLS', {
      fontSize: '6px', color: '#ffcc44', fontFamily: 'monospace',
      stroke: '#110800', strokeThickness: 2,
    }).setOrigin(0.5);

    [
      '👆 TAP — move aircraft',
      '✈ TAP SILO — auto-intercept',
      '2× TAP SILO — missile strike',
      '💣 / 🚀  weapon buttons below',
    ].forEach((l, i) => {
      this.add.text(24, 235 + i * 12, l, {
        fontSize: '5px', color: '#7799aa', fontFamily: 'monospace',
      });
    });

    // ── START button ──────────────────────────────────────────────────────
    const btnGfx = this.add.graphics();
    const drawStartBtn = (hover: boolean) => {
      btnGfx.clear();
      // outer glow
      btnGfx.fillStyle(0x44ff44, hover ? 0.25 : 0.12);
      btnGfx.fillRoundedRect(GAME_WIDTH / 2 - 92, 300, 184, 38, 12);
      // base
      btnGfx.fillGradientStyle(
        hover ? 0x226622 : 0x1a4a1a, hover ? 0x226622 : 0x1a4a1a,
        hover ? 0x338833 : 0x224422, hover ? 0x338833 : 0x224422, 1);
      btnGfx.fillRoundedRect(GAME_WIDTH / 2 - 90, 302, 180, 34, 10);
      // top highlight
      btnGfx.fillStyle(0xffffff, 0.09);
      btnGfx.fillRoundedRect(GAME_WIDTH / 2 - 88, 303, 176, 16, 9);
      // border
      btnGfx.lineStyle(2, 0x44ff44, 0.9);
      btnGfx.strokeRoundedRect(GAME_WIDTH / 2 - 90, 302, 180, 34, 10);
    };
    drawStartBtn(false);

    this.add.text(GAME_WIDTH / 2, 319, '▶  START MISSION', {
      fontSize: '9px', color: '#55ff55', fontFamily: 'monospace',
      stroke: '#001100', strokeThickness: 3,
    }).setOrigin(0.5);

    const btnHit = this.add.rectangle(GAME_WIDTH / 2, 319, 180, 34, 0, 0).setInteractive();
    btnHit.on('pointerover',  () => drawStartBtn(true));
    btnHit.on('pointerout',   () => drawStartBtn(false));
    btnHit.on('pointerdown',  () => {
      this.tweens.add({ targets: btnHit, scaleX: 0.95, scaleY: 0.95, duration: 60, yoyo: true,
        onComplete: () => this.scene.start('GameScene') });
    });

    // ── Version / tap hint ────────────────────────────────────────────────
    const blink = this.add.text(GAME_WIDTH / 2, 360, '— TAP ANYWHERE TO BEGIN —', {
      fontSize: '4px', color: '#2a4433', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.tweens.add({ targets: blink, alpha: 0.1, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.input.once('pointerdown', () => this.scene.start('GameScene'));
  }
}

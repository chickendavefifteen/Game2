import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';

export class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create(): void {
    // ── Background ───────────────────────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x02040e, 0x02040e, 0x060c22, 0x060c22, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Stars
    const stars = this.add.graphics();
    for (let i = 0; i < 80; i++) {
      const sx = (i * 137 + 23) % GAME_WIDTH;
      const sy = (i * 97  + 11) % (GAME_HEIGHT * 0.6);
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
    sea.fillGradientStyle(0x0a1835, 0x0a1835, 0x1a3868, 0x1a3868, 0.9);
    sea.fillRect(0, GAME_HEIGHT * 0.55, GAME_WIDTH, GAME_HEIGHT * 0.45);

    // ── US flag stripe ────────────────────────────────────────────────────
    this.add.rectangle(0, 0, GAME_WIDTH, 6, 0xcc1111).setOrigin(0, 0);
    this.add.rectangle(0, 6, GAME_WIDTH, 6, 0xffffff).setOrigin(0, 0);
    this.add.rectangle(0, 12, GAME_WIDTH, 6, 0x1133cc).setOrigin(0, 0);

    // ── Title glow ───────────────────────────────────────────────────────
    const halo = this.add.graphics();
    halo.fillStyle(0xff2200, 0.07); halo.fillEllipse(GAME_WIDTH / 2, 74, 220, 80);
    halo.fillStyle(0xff4400, 0.1);  halo.fillEllipse(GAME_WIDTH / 2, 74, 150, 55);

    // ── HORMUZ / DEFENDER title ───────────────────────────────────────────
    this.add.text(GAME_WIDTH / 2, 54, 'HORMUZ', {
      fontSize: '30px', color: '#ff3322', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#220000', strokeThickness: 7,
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 90, 'DEFENDER', {
      fontSize: '18px', color: '#ffcc00', fontFamily: 'monospace',
      stroke: '#221100', strokeThickness: 4,
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 114, 'Protect the strait. Secure the oil.', {
      fontSize: '8px', color: '#5577aa', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Divider
    const div = this.add.graphics();
    div.lineStyle(1, 0x224466, 0.8);
    div.lineBetween(16, 126, GAME_WIDTH - 16, 126);
    div.fillStyle(0x3388cc, 1);
    for (const dx of [16, GAME_WIDTH / 2, GAME_WIDTH - 16]) div.fillRect(dx - 2, 124, 4, 4);

    // ── MISSION BRIEFING card ─────────────────────────────────────────────
    const card1 = this.add.graphics();
    card1.fillStyle(0x07101c, 0.82);
    card1.fillRoundedRect(12, 132, GAME_WIDTH - 24, 96, 8);
    card1.lineStyle(1.5, 0x1a3355, 0.9);
    card1.strokeRoundedRect(12, 132, GAME_WIDTH - 24, 96, 8);

    this.add.text(GAME_WIDTH / 2, 142, 'MISSION BRIEFING', {
      fontSize: '10px', color: '#ffcc44', fontFamily: 'monospace',
      stroke: '#110800', strokeThickness: 3,
    }).setOrigin(0.5);

    [
      '💣  Bomb silos before they fire',
      '🚢  Protect oil tankers',
      '🏙  Defend Gulf cities',
    ].forEach((l, i) => {
      this.add.text(22, 158 + i * 20, l, {
        fontSize: '9px', color: '#88ccaa', fontFamily: 'monospace',
        stroke: '#010a05', strokeThickness: 2,
      });
    });

    // ── CONTROLS card ─────────────────────────────────────────────────────
    const card2 = this.add.graphics();
    card2.fillStyle(0x060e18, 0.78);
    card2.fillRoundedRect(12, 234, GAME_WIDTH - 24, 100, 8);
    card2.lineStyle(1.5, 0x1a2d44, 0.9);
    card2.strokeRoundedRect(12, 234, GAME_WIDTH - 24, 100, 8);

    this.add.text(GAME_WIDTH / 2, 244, 'CONTROLS', {
      fontSize: '10px', color: '#ffcc44', fontFamily: 'monospace',
      stroke: '#110800', strokeThickness: 3,
    }).setOrigin(0.5);

    [
      '👆  TAP — move aircraft',
      '✈  TAP SILO — intercept',
      '2×  SILO — missile strike',
      '💣  /  🚀  buttons at bottom',
    ].forEach((l, i) => {
      this.add.text(22, 260 + i * 18, l, {
        fontSize: '8px', color: '#7799aa', fontFamily: 'monospace',
        stroke: '#01080f', strokeThickness: 2,
      });
    });

    // ── START button ──────────────────────────────────────────────────────
    const btnY = 364;
    const btnGfx = this.add.graphics();
    const drawBtn = (hover: boolean) => {
      btnGfx.clear();
      btnGfx.fillStyle(0x44ff44, hover ? 0.22 : 0.1);
      btnGfx.fillRoundedRect(GAME_WIDTH / 2 - 96, btnY - 22, 192, 44, 12);
      btnGfx.fillGradientStyle(
        hover ? 0x226622 : 0x163316, hover ? 0x226622 : 0x163316,
        hover ? 0x2d7a2d : 0x1e4a1e, hover ? 0x2d7a2d : 0x1e4a1e, 1);
      btnGfx.fillRoundedRect(GAME_WIDTH / 2 - 94, btnY - 20, 188, 40, 10);
      btnGfx.fillStyle(0xffffff, 0.1);
      btnGfx.fillRoundedRect(GAME_WIDTH / 2 - 92, btnY - 19, 184, 18, 9);
      btnGfx.lineStyle(2.5, 0x44ff44, 0.95);
      btnGfx.strokeRoundedRect(GAME_WIDTH / 2 - 94, btnY - 20, 188, 40, 10);
    };
    drawBtn(false);
    this.add.text(GAME_WIDTH / 2, btnY, '▶   START MISSION', {
      fontSize: '12px', color: '#55ff55', fontFamily: 'monospace',
      stroke: '#001100', strokeThickness: 4,
    }).setOrigin(0.5);

    const hit = this.add.rectangle(GAME_WIDTH / 2, btnY, 188, 40, 0, 0).setInteractive();
    hit.on('pointerover',  () => drawBtn(true));
    hit.on('pointerout',   () => drawBtn(false));
    hit.on('pointerdown',  () => {
      this.tweens.add({ targets: hit, scaleX: 0.94, scaleY: 0.94, duration: 60, yoyo: true,
        onComplete: () => this.scene.start('GameScene') });
    });

    // ── Blink hint ────────────────────────────────────────────────────────
    const blink = this.add.text(GAME_WIDTH / 2, 416, '— TAP ANYWHERE TO BEGIN —', {
      fontSize: '7px', color: '#2a4433', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.tweens.add({ targets: blink, alpha: 0.15, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.input.once('pointerdown', () => this.scene.start('GameScene'));
  }
}

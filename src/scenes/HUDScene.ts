import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { BALANCE } from '../config/BalanceConfig';
import { EventBus } from '../utils/EventBus';

export class HUDScene extends Phaser.Scene {
  private scoreText!:    Phaser.GameObjects.Text;
  private waveText!:     Phaser.GameObjects.Text;
  private livesRow!:     Phaser.GameObjects.Text;
  private oilDelivered!: Phaser.GameObjects.Text;
  private oilLostText!:  Phaser.GameObjects.Text;
  private reservesBar!:  Phaser.GameObjects.Graphics;
  private reservesLabel!:Phaser.GameObjects.Text;
  private reservesMax = BALANCE.oil.startingReserves;

  constructor() { super({ key: 'HUDScene' }); }

  private livesCount = 3;
  private reservesRatio = 1.0;

  create(): void {
    // ── TOP PANEL background ──────────────────────────────────────────────
    const topGfx = this.add.graphics().setDepth(98);
    // rich dark gradient panel
    topGfx.fillGradientStyle(0x060d1e, 0x060d1e, 0x0d1830, 0x0d1830, 1);
    topGfx.fillRect(0, 0, GAME_WIDTH, 34);
    // accent border bottom
    topGfx.fillStyle(0x2255aa, 0.7);
    topGfx.fillRect(0, 33, GAME_WIDTH, 1);
    // subtle left accent
    topGfx.fillStyle(0x3388ff, 0.4);
    topGfx.fillRect(0, 0, 3, 34);

    // ── SCORE — left ──────────────────────────────────────────────────────
    this.add.text(8, 4, 'SCORE', {
      fontSize: '5px', color: '#4477aa', fontFamily: 'monospace',
    }).setDepth(100);
    this.scoreText = this.add.text(8, 13, '0', {
      fontSize: '11px', color: '#ffee66', fontFamily: 'monospace',
      stroke: '#110a00', strokeThickness: 3,
    }).setDepth(100);

    // ── WAVE — centre ─────────────────────────────────────────────────────
    this.add.text(GAME_WIDTH / 2, 4, 'WAVE', {
      fontSize: '5px', color: '#4477aa', fontFamily: 'monospace',
    }).setOrigin(0.5, 0).setDepth(100);
    this.waveText = this.add.text(GAME_WIDTH / 2, 13, '1', {
      fontSize: '11px', color: '#55ccff', fontFamily: 'monospace',
      stroke: '#001122', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(100);

    // ── LIVES — right ─────────────────────────────────────────────────────
    this.add.text(GAME_WIDTH - 8, 4, 'LIVES', {
      fontSize: '5px', color: '#4477aa', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(100);
    this.livesRow = this.add.text(GAME_WIDTH - 8, 12, '♥ ♥ ♥', {
      fontSize: '10px', color: '#ff3355', fontFamily: 'monospace',
      stroke: '#220011', strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(100);

    // ── OIL STATS ROW ────────────────────────────────────────────────────
    const oilGfx = this.add.graphics().setDepth(98);
    oilGfx.fillGradientStyle(0x040810, 0x040810, 0x081018, 0x081018, 0.92);
    oilGfx.fillRect(0, 35, GAME_WIDTH, 22);
    oilGfx.fillStyle(0x1a3344, 0.6);
    oilGfx.fillRect(0, 56, GAME_WIDTH, 1);

    // centre divider
    oilGfx.fillStyle(0x1a3344, 0.5);
    oilGfx.fillRect(GAME_WIDTH / 2, 37, 1, 18);

    this.add.text(8, 38, '🛢 DELIVERED', {
      fontSize: '5px', color: '#338866', fontFamily: 'monospace',
    }).setDepth(100);
    this.oilDelivered = this.add.text(8, 47, '0.0 Mbbl', {
      fontSize: '7px', color: '#55ffcc', fontFamily: 'monospace',
      stroke: '#001a0e', strokeThickness: 2,
    }).setDepth(100);

    this.add.text(GAME_WIDTH / 2 + 6, 38, '☠ SPILLED', {
      fontSize: '5px', color: '#884422', fontFamily: 'monospace',
    }).setDepth(100);
    this.oilLostText = this.add.text(GAME_WIDTH / 2 + 6, 47, '0.0 Mbbl', {
      fontSize: '7px', color: '#ff7733', fontFamily: 'monospace',
      stroke: '#1a0800', strokeThickness: 2,
    }).setDepth(100);

    // ── GULF RESERVES BAR ─────────────────────────────────────────────────
    const barPanelY = GAME_HEIGHT - 56;
    const resGfx = this.add.graphics().setDepth(98);
    resGfx.fillGradientStyle(0x040810, 0x040810, 0x06101a, 0x06101a, 0.92);
    resGfx.fillRect(0, barPanelY - 1, GAME_WIDTH, 22);
    resGfx.fillStyle(0x1a3344, 0.5);
    resGfx.fillRect(0, barPanelY - 1, GAME_WIDTH, 1);

    this.add.text(8, barPanelY + 2, '⛽ GULF RESERVES', {
      fontSize: '5px', color: '#557788', fontFamily: 'monospace',
    }).setDepth(100);
    this.reservesLabel = this.add.text(GAME_WIDTH - 8, barPanelY + 2, '50.0 Mbbl', {
      fontSize: '5px', color: '#ffcc55', fontFamily: 'monospace',
      stroke: '#110800', strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(100);

    // Bar track (rounded)
    const barTrack = this.add.graphics().setDepth(99);
    barTrack.fillStyle(0x0d1520, 1);
    barTrack.fillRoundedRect(7, barPanelY + 12, GAME_WIDTH - 14, 8, 4);
    barTrack.lineStyle(1, 0x1a2a3a, 0.8);
    barTrack.strokeRoundedRect(7, barPanelY + 12, GAME_WIDTH - 14, 8, 4);

    this.reservesBar = this.add.graphics().setDepth(100);
    this.drawReservesBar(1.0);

    // ── EVENT LISTENERS ──────────────────────────────────────────────────
    EventBus.on('scoreChanged', ({ score }) => {
      this.scoreText.setText(score.toLocaleString());
    }, this);

    EventBus.on('livesChanged', ({ lives }) => {
      this.livesCount = lives;
      const hearts = ['', '♥', '♥ ♥', '♥ ♥ ♥'];
      this.livesRow.setText(hearts[Math.max(0, Math.min(3, lives))]);
      this.livesRow.setColor(lives <= 1 ? '#ff0000' : lives === 2 ? '#ff8800' : '#ff3355');
    }, this);

    EventBus.on('oilChanged', ({ transported, lost, reserves }) => {
      this.oilDelivered.setText(`${(transported / 1e6).toFixed(1)} Mbbl`);
      this.oilLostText.setText(`${(lost / 1e6).toFixed(1)} Mbbl`);
      this.reservesLabel.setText(`${(reserves / 1e6).toFixed(1)} Mbbl`);
      this.reservesRatio = reserves / this.reservesMax;
      this.drawReservesBar(this.reservesRatio);
    }, this);

    EventBus.on('waveComplete', ({ waveNumber }) => {
      this.waveText.setText(`${waveNumber + 1}`);
      // flash wave number on increment
      this.tweens.add({
        targets: this.waveText, scaleX: 1.4, scaleY: 1.4,
        duration: 200, yoyo: true,
      });
    }, this);
  }

  private drawReservesBar(ratio: number): void {
    const barPanelY = GAME_HEIGHT - 56;
    const barY = barPanelY + 12;
    const bw   = GAME_WIDTH - 14;
    const bh   = 8;
    const bx   = 7;
    const r    = 4;
    this.reservesBar.clear();

    // Filled portion
    const fillW = Math.max(0, Math.round(bw * ratio));
    if (fillW > 0) {
      // color: green → yellow → red (left to right = high to low)
      const isCritical = ratio < 0.2;
      const isLow      = ratio < 0.45;
      let col1: number, col2: number;
      if (isCritical) {
        col1 = 0xdd2200; col2 = 0xff3300;
      } else if (isLow) {
        col1 = 0xcc8800; col2 = 0xffaa00;
      } else {
        col1 = 0x118833; col2 = 0x22cc55;
      }
      this.reservesBar.fillGradientStyle(col1, col2, col1, col2, 1);
      this.reservesBar.fillRoundedRect(bx, barY, fillW, bh, r);

      // gloss highlight on top half
      this.reservesBar.fillStyle(0xffffff, 0.12);
      this.reservesBar.fillRoundedRect(bx + 1, barY + 1, fillW - 2, bh / 2, r);
    }

    // Segment tick marks
    const segs = 10;
    this.reservesBar.lineStyle(1, 0x000000, 0.3);
    for (let i = 1; i < segs; i++) {
      const tx = bx + Math.round((bw / segs) * i);
      this.reservesBar.lineBetween(tx, barY + 1, tx, barY + bh - 1);
    }

    // Critical flash overlay
    if (ratio < 0.2 && Math.floor(Date.now() / 280) % 2 === 0) {
      this.reservesBar.fillStyle(0xff2200, 0.22);
      this.reservesBar.fillRoundedRect(bx, barY, bw, bh, r);
    }
  }

  update(): void {
    // Re-draw bar each frame so critical pulse animates
    if (this.reservesRatio < 0.2) this.drawReservesBar(this.reservesRatio);
  }

  shutdown(): void {
    EventBus.off('scoreChanged',  undefined, this);
    EventBus.off('livesChanged',  undefined, this);
    EventBus.off('oilChanged',    undefined, this);
    EventBus.off('waveComplete',  undefined, this);
  }
}

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

  create(): void {
    // ── TOP BAR ─────────────────────────────────────────────────────────────
    // Solid dark background stripe
    this.add.rectangle(0, 0, GAME_WIDTH, 34, 0x0a0e1a, 0.92)
      .setOrigin(0, 0).setDepth(98);
    // Bottom border accent
    this.add.rectangle(0, 34, GAME_WIDTH, 1, 0x334466).setOrigin(0, 0).setDepth(98);

    // Score — left
    this.add.text(8, 5, 'SCORE', {
      fontSize: '4px', color: '#668899', fontFamily: 'monospace',
    }).setDepth(100);
    this.scoreText = this.add.text(8, 13, '0', {
      fontSize: '9px', color: '#ffff88', fontFamily: 'monospace',
    }).setDepth(100);

    // Wave — centre
    this.waveText = this.add.text(GAME_WIDTH / 2, 10, 'WAVE 1', {
      fontSize: '8px', color: '#88ddff', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(100);

    // Lives — right (heart icons)
    this.add.text(GAME_WIDTH - 8, 5, 'LIVES', {
      fontSize: '4px', color: '#668899', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(100);
    this.livesRow = this.add.text(GAME_WIDTH - 8, 13, '♥ ♥ ♥', {
      fontSize: '9px', color: '#ff5566', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(100);

    // ── OIL STATS ROW ────────────────────────────────────────────────────────
    this.add.rectangle(0, 35, GAME_WIDTH, 20, 0x060a12, 0.85)
      .setOrigin(0, 0).setDepth(98);
    this.add.rectangle(0, 55, GAME_WIDTH, 1, 0x223344).setOrigin(0, 0).setDepth(98);

    // Delivered
    this.add.text(8, 39, '🛢 DELIVERED', {
      fontSize: '5px', color: '#55aa88', fontFamily: 'monospace',
    }).setDepth(100);
    this.oilDelivered = this.add.text(8, 47, '0.0 Mbbl', {
      fontSize: '6px', color: '#88ffcc', fontFamily: 'monospace',
    }).setDepth(100);

    // Separator
    this.add.rectangle(GAME_WIDTH / 2, 38, 1, 16, 0x334455).setDepth(100);

    // Spilled
    this.add.text(GAME_WIDTH / 2 + 6, 39, '☠ SPILLED', {
      fontSize: '5px', color: '#aa5533', fontFamily: 'monospace',
    }).setDepth(100);
    this.oilLostText = this.add.text(GAME_WIDTH / 2 + 6, 47, '0.0 Mbbl', {
      fontSize: '6px', color: '#ff8844', fontFamily: 'monospace',
    }).setDepth(100);

    // ── GULF RESERVES BAR ─────────────────────────────────────────────────
    const barY = GAME_HEIGHT - 62;
    this.add.rectangle(0, barY - 2, GAME_WIDTH, 22, 0x060a12, 0.88)
      .setOrigin(0, 0).setDepth(98);
    this.add.rectangle(0, barY - 2, GAME_WIDTH, 1, 0x223344).setOrigin(0, 0).setDepth(98);

    this.add.text(8, barY + 1, 'GULF RESERVES', {
      fontSize: '5px', color: '#8899aa', fontFamily: 'monospace',
    }).setDepth(100);

    this.reservesLabel = this.add.text(GAME_WIDTH - 8, barY + 1, '50.0 Mbbl', {
      fontSize: '5px', color: '#ffdd88', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(100);

    // Bar track
    this.add.rectangle(8, barY + 10, GAME_WIDTH - 16, 7, 0x1a1a2a)
      .setOrigin(0, 0).setDepth(99);
    this.reservesBar = this.add.graphics().setDepth(100);
    this.drawReservesBar(1.0);

    // ── EVENT LISTENERS ──────────────────────────────────────────────────
    EventBus.on('scoreChanged', ({ score }) => {
      this.scoreText.setText(score.toLocaleString());
    }, this);

    EventBus.on('livesChanged', ({ lives }) => {
      this.livesRow.setText(['', '♥', '♥ ♥', '♥ ♥ ♥'][Math.max(0, Math.min(3, lives))]);
    }, this);

    EventBus.on('oilChanged', ({ transported, lost, reserves }) => {
      this.oilDelivered.setText(`${(transported / 1e6).toFixed(1)} Mbbl`);
      this.oilLostText.setText(`${(lost / 1e6).toFixed(1)} Mbbl`);
      this.reservesLabel.setText(`${(reserves / 1e6).toFixed(1)} Mbbl`);
      this.drawReservesBar(reserves / this.reservesMax);
    }, this);

    EventBus.on('waveComplete', ({ waveNumber }) => {
      this.waveText.setText(`WAVE ${waveNumber + 1}`);
    }, this);
  }

  private drawReservesBar(ratio: number): void {
    const barY = GAME_HEIGHT - 62 + 10;
    const bw   = GAME_WIDTH - 16;
    this.reservesBar.clear();

    // Segmented bar — clearer than a plain fill
    const segments = 10;
    const sw = Math.floor(bw / segments) - 1;
    const filled = Math.round(ratio * segments);

    for (let i = 0; i < segments; i++) {
      const isFilled = i < filled;
      const segRatio = i / (segments - 1);
      let color: number;
      if (!isFilled) {
        color = 0x1e2030;
      } else if (segRatio < 0.3) {
        color = 0xcc2200;
      } else if (segRatio < 0.6) {
        color = 0xddaa00;
      } else {
        color = 0x22aa44;
      }
      this.reservesBar.fillStyle(color);
      this.reservesBar.fillRect(8 + i * (sw + 1), barY, sw, 7);
    }

    // Danger pulse on last segment when critical
    if (ratio < 0.2 && Math.floor(Date.now() / 300) % 2 === 0) {
      this.reservesBar.fillStyle(0xff2200, 0.5);
      this.reservesBar.fillRect(8, barY, bw, 7);
    }
  }

  shutdown(): void {
    EventBus.off('scoreChanged',  undefined, this);
    EventBus.off('livesChanged',  undefined, this);
    EventBus.off('oilChanged',    undefined, this);
    EventBus.off('waveComplete',  undefined, this);
  }
}

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { BALANCE } from '../config/BalanceConfig';
import { EventBus } from '../utils/EventBus';

export class HUDScene extends Phaser.Scene {
  private scoreText!:      Phaser.GameObjects.Text;
  private waveText!:       Phaser.GameObjects.Text;
  private livesText!:      Phaser.GameObjects.Text;
  private oilDelivered!:   Phaser.GameObjects.Text;
  private oilLostText!:    Phaser.GameObjects.Text;
  private reservesBar!:    Phaser.GameObjects.Graphics;
  private reservesLabel!:  Phaser.GameObjects.Text;
  private reservesMax = BALANCE.oil.startingReserves;

  constructor() { super({ key: 'HUDScene' }); }

  create(): void {
    // ── Top bar background ──
    this.add.rectangle(0, 0, GAME_WIDTH, 28, 0x000000, 0.6).setOrigin(0, 0).setDepth(99);

    // Score
    this.scoreText = this.add.text(6, 4, 'SCORE: 0', {
      fontSize: '6px', color: '#ffff88', fontFamily: 'monospace',
    }).setDepth(100);

    // Wave — center
    this.waveText = this.add.text(GAME_WIDTH / 2, 4, 'WAVE 1', {
      fontSize: '6px', color: '#88ffff', fontFamily: 'monospace',
    }).setOrigin(0.5, 0).setDepth(100);

    // Lives — right
    this.livesText = this.add.text(GAME_WIDTH - 6, 4, '♦♦♦', {
      fontSize: '6px', color: '#ff8888', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(100);

    // Second row: oil stats
    this.add.rectangle(0, 18, GAME_WIDTH, 12, 0x000000, 0.45).setOrigin(0, 0).setDepth(99);

    this.add.text(6, 19, '🛢 DELIVERED:', {
      fontSize: '5px', color: '#88ffcc', fontFamily: 'monospace',
    }).setDepth(100);
    this.oilDelivered = this.add.text(90, 19, '0 Mbbl', {
      fontSize: '5px', color: '#88ffcc', fontFamily: 'monospace',
    }).setDepth(100);

    this.add.text(GAME_WIDTH / 2 + 4, 19, '💀 LOST:', {
      fontSize: '5px', color: '#ff8844', fontFamily: 'monospace',
    }).setDepth(100);
    this.oilLostText = this.add.text(GAME_WIDTH - 6, 19, '0', {
      fontSize: '5px', color: '#ff8844', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(100);

    // ── Gulf Reserves bar — sits just above bottom buttons ──
    const barY = GAME_HEIGHT - 54;
    this.add.rectangle(0, barY - 2, GAME_WIDTH, 16, 0x000000, 0.55).setOrigin(0, 0).setDepth(99);
    this.add.text(6, barY, 'GULF RESERVES', {
      fontSize: '4px', color: '#aabbcc', fontFamily: 'monospace',
    }).setDepth(100);
    this.reservesLabel = this.add.text(GAME_WIDTH - 6, barY, '50.0 Mbbl', {
      fontSize: '4px', color: '#ffdd88', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(100);

    // Bar
    this.add.rectangle(6, barY + 7, GAME_WIDTH - 12, 5, 0x222222).setOrigin(0, 0).setDepth(100);
    this.reservesBar = this.add.graphics().setDepth(101);
    this.drawReservesBar(1.0);

    // Events
    EventBus.on('scoreChanged', ({ score }) => {
      this.scoreText.setText(`SCORE: ${score.toLocaleString()}`);
    }, this);

    EventBus.on('livesChanged', ({ lives }) => {
      this.livesText.setText('♦'.repeat(Math.max(0, lives)));
    }, this);

    EventBus.on('oilChanged', ({ transported, lost, reserves }) => {
      this.oilDelivered.setText(`${(transported / 1_000_000).toFixed(1)}M`);
      this.oilLostText.setText(`${(lost / 1_000_000).toFixed(1)}M`);
      this.drawReservesBar(reserves / this.reservesMax);
      this.reservesLabel.setText(`${(reserves / 1_000_000).toFixed(1)} Mbbl`);
    }, this);

    EventBus.on('waveComplete', ({ waveNumber }) => {
      this.waveText.setText(`WAVE ${waveNumber + 1}`);
    }, this);
  }

  private drawReservesBar(ratio: number): void {
    const barY = GAME_HEIGHT - 54 + 7;
    this.reservesBar.clear();
    const color = ratio > 0.5 ? 0x22aa22 : ratio > 0.25 ? 0xddaa00 : 0xcc2200;
    this.reservesBar.fillStyle(color);
    this.reservesBar.fillRect(6, barY, Math.round((GAME_WIDTH - 12) * ratio), 5);
  }

  shutdown(): void {
    EventBus.off('scoreChanged',  undefined, this);
    EventBus.off('livesChanged',  undefined, this);
    EventBus.off('oilChanged',    undefined, this);
    EventBus.off('waveComplete',  undefined, this);
  }
}

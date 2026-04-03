import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/GameConfig';
import { BALANCE } from '../config/BalanceConfig';
import { EventBus } from '../utils/EventBus';

export class HUDScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private oilTransportedText!: Phaser.GameObjects.Text;
  private oilLostText!: Phaser.GameObjects.Text;
  private reservesBar!: Phaser.GameObjects.Graphics;
  private reservesBg!: Phaser.GameObjects.Rectangle;
  private reservesLabel!: Phaser.GameObjects.Text;
  private reservesMax: number = BALANCE.oil.startingReserves;

  constructor() {
    super({ key: 'HUDScene' });
  }

  create(): void {
    // Score — top left
    this.scoreText = this.add.text(4, 2, 'SCORE: 0', {
      fontSize: '5px', color: '#ffff88', fontFamily: 'monospace'
    }).setDepth(100);

    // Wave — top center
    this.waveText = this.add.text(GAME_WIDTH / 2, 2, 'WAVE 1', {
      fontSize: '5px', color: '#88ffff', fontFamily: 'monospace'
    }).setOrigin(0.5, 0).setDepth(100);

    // Lives — top right
    this.livesText = this.add.text(GAME_WIDTH - 4, 2, `♦♦♦`, {
      fontSize: '5px', color: '#ff8888', fontFamily: 'monospace'
    }).setOrigin(1, 0).setDepth(100);

    // Oil transported — right side
    this.add.text(GAME_WIDTH - 4, 14, '🛢 DELIVERED', {
      fontSize: '4px', color: '#aabbcc', fontFamily: 'monospace'
    }).setOrigin(1, 0).setDepth(100);

    this.oilTransportedText = this.add.text(GAME_WIDTH - 4, 20, '0 Mbbl', {
      fontSize: '4px', color: '#88ffcc', fontFamily: 'monospace'
    }).setOrigin(1, 0).setDepth(100);

    // Oil lost
    this.add.text(GAME_WIDTH - 4, 27, '💀 SPILLED', {
      fontSize: '4px', color: '#aabbcc', fontFamily: 'monospace'
    }).setOrigin(1, 0).setDepth(100);

    this.oilLostText = this.add.text(GAME_WIDTH - 4, 33, '0 Mbbl', {
      fontSize: '4px', color: '#ff8844', fontFamily: 'monospace'
    }).setOrigin(1, 0).setDepth(100);

    // Gulf Reserves gauge — bottom center
    const barX = GAME_WIDTH / 2 - 50;
    const barY = 258;

    this.add.text(GAME_WIDTH / 2, barY - 7, 'GULF RESERVES', {
      fontSize: '4px', color: '#aabbcc', fontFamily: 'monospace'
    }).setOrigin(0.5, 0).setDepth(100);

    this.reservesBg = this.add.rectangle(barX, barY, 100, 5, 0x222222).setOrigin(0, 0).setDepth(100);
    this.reservesBar = this.add.graphics().setDepth(101);
    this.reservesLabel = this.add.text(GAME_WIDTH / 2, barY + 6, '50.0 Mbbl', {
      fontSize: '4px', color: '#ffdd88', fontFamily: 'monospace'
    }).setOrigin(0.5, 0).setDepth(100);

    this.drawReservesBar(1.0);

    // Listen to events
    EventBus.on('scoreChanged', ({ score }) => {
      this.scoreText.setText(`SCORE: ${score.toLocaleString()}`);
    }, this);

    EventBus.on('livesChanged', ({ lives }) => {
      this.livesText.setText('♦'.repeat(Math.max(0, lives)));
    }, this);

    EventBus.on('oilChanged', ({ transported, lost, reserves }) => {
      this.oilTransportedText.setText(`${(transported / 1_000_000).toFixed(1)} Mbbl`);
      this.oilLostText.setText(`${(lost / 1_000_000).toFixed(1)} Mbbl`);
      this.drawReservesBar(reserves / this.reservesMax);
      this.reservesLabel.setText(`${(reserves / 1_000_000).toFixed(1)} Mbbl`);
    }, this);

    EventBus.on('waveComplete', ({ waveNumber }) => {
      this.waveText.setText(`WAVE ${waveNumber + 1}`);
    }, this);
  }

  private drawReservesBar(ratio: number): void {
    const barX = GAME_WIDTH / 2 - 50;
    const barY = 258;
    this.reservesBar.clear();
    const color = ratio > 0.5 ? 0x22aa22 : ratio > 0.25 ? 0xddaa00 : 0xcc2200;
    this.reservesBar.fillStyle(color);
    this.reservesBar.fillRect(barX, barY, Math.round(100 * ratio), 5);
  }

  shutdown(): void {
    EventBus.off('scoreChanged', undefined, this);
    EventBus.off('livesChanged', undefined, this);
    EventBus.off('oilChanged', undefined, this);
    EventBus.off('waveComplete', undefined, this);
  }
}

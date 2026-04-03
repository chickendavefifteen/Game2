import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';

interface MissionReport {
  score: number; oilTransported: number; oilLost: number;
  gulfReserves: number; silosDestroyed: number;
  shipsProtected: number; shipsSunk: number; wave: number; victory: boolean;
}

export class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  init(data: MissionReport): void { this.buildReport(data); }
  create(): void {}

  private buildReport(data: MissionReport): void {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.88).setOrigin(0, 0);

    const titleColor = data.victory ? '#44ff44' : '#ff4444';
    this.add.text(GAME_WIDTH / 2, 40, data.victory ? '✓ MISSION COMPLETE' : '✗ MISSION FAILED', {
      fontSize: '11px', color: titleColor, fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 62, `WAVE ${data.wave} REACHED`, {
      fontSize: '6px', color: '#88aacc', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 82, `FINAL SCORE`, {
      fontSize: '6px', color: '#aabbcc', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 94, data.score.toLocaleString(), {
      fontSize: '14px', color: '#ffdd88', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Divider
    this.add.rectangle(20, 118, GAME_WIDTH - 40, 1, 0x334455).setOrigin(0, 0);
    this.add.text(GAME_WIDTH / 2, 124, '── MISSION REPORT ──', {
      fontSize: '5px', color: '#aabbcc', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const rows: [string, string, string][] = [
      ['OIL TRANSPORTED', `${(data.oilTransported/1e6).toFixed(1)} Mbbl`, '#88ffcc'],
      ['OIL SPILLED',     `${(data.oilLost/1e6).toFixed(1)} Mbbl`,        '#ff8844'],
      ['GULF RESERVES',   `${(data.gulfReserves/1e6).toFixed(1)} Mbbl`,   '#ffdd88'],
      ['SILOS DESTROYED', `${data.silosDestroyed}`,                       '#88ffff'],
      ['SHIPS PROTECTED', `${data.shipsProtected}`,                       '#88ffcc'],
      ['SHIPS SUNK',      `${data.shipsSunk}`,                            '#ff8888'],
    ];

    rows.forEach(([label, value, color], i) => {
      const y = 140 + i * 18;
      this.add.text(18, y, label, { fontSize: '5px', color: '#aabbcc', fontFamily: 'monospace' });
      this.add.text(GAME_WIDTH - 18, y, value, {
        fontSize: '5px', color, fontFamily: 'monospace',
      }).setOrigin(1, 0);
      this.add.rectangle(18, y + 13, GAME_WIDTH - 36, 1, 0x223344, 0.5).setOrigin(0, 0);
    });

    // Oil efficiency
    const total = data.oilTransported + data.oilLost;
    const eff   = total > 0 ? Math.round((data.oilTransported / total) * 100) : 0;
    const effColor = eff >= 75 ? '#44ff44' : eff >= 40 ? '#ffdd00' : '#ff4444';
    this.add.text(GAME_WIDTH / 2, 254, `TRANSIT EFFICIENCY: ${eff}%`, {
      fontSize: '6px', color: effColor, fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Buttons
    const retry = this.add.rectangle(GAME_WIDTH / 2, 292, 180, 26, 0x225522, 0.9)
      .setStrokeStyle(1, 0x44ff44, 0.9).setInteractive();
    this.add.text(GAME_WIDTH / 2, 292, '▶  RETRY MISSION', {
      fontSize: '7px', color: '#44ff44', fontFamily: 'monospace',
    }).setOrigin(0.5);
    retry.on('pointerdown', () => this.scene.start('GameScene'));

    const menu = this.add.rectangle(GAME_WIDTH / 2, 328, 180, 26, 0x222244, 0.9)
      .setStrokeStyle(1, 0x8888ff, 0.9).setInteractive();
    this.add.text(GAME_WIDTH / 2, 328, '◀  MAIN MENU', {
      fontSize: '7px', color: '#8888ff', fontFamily: 'monospace',
    }).setOrigin(0.5);
    menu.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}

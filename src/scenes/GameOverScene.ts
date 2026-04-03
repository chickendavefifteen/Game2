import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';

interface MissionReport {
  score: number;
  oilTransported: number;
  oilLost: number;
  gulfReserves: number;
  silosDestroyed: number;
  shipsProtected: number;
  shipsSunk: number;
  wave: number;
  victory: boolean;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: MissionReport): void {
    this.createReport(data);
  }

  private createReport(data: MissionReport): void {
    // Dark overlay
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85).setOrigin(0, 0);

    const titleColor = data.victory ? '#44ff44' : '#ff4444';
    const titleText = data.victory ? '✓ MISSION COMPLETE' : '✗ MISSION FAILED';

    this.add.text(GAME_WIDTH / 2, 22, titleText, {
      fontSize: '10px', color: titleColor, fontFamily: 'monospace'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 36, `WAVE ${data.wave} REACHED`, {
      fontSize: '5px', color: '#88aacc', fontFamily: 'monospace'
    }).setOrigin(0.5);

    // Score
    this.add.text(GAME_WIDTH / 2, 52, `FINAL SCORE: ${data.score.toLocaleString()}`, {
      fontSize: '8px', color: '#ffdd88', fontFamily: 'monospace'
    }).setOrigin(0.5);

    // Mission Report header
    this.add.text(GAME_WIDTH / 2, 70, '── MISSION REPORT ──', {
      fontSize: '5px', color: '#aabbcc', fontFamily: 'monospace'
    }).setOrigin(0.5);

    const rows: [string, string, string][] = [
      ['OIL TRANSPORTED', `${(data.oilTransported / 1_000_000).toFixed(1)} Mbbl`, '#88ffcc'],
      ['OIL SPILLED',     `${(data.oilLost / 1_000_000).toFixed(1)} Mbbl`,        '#ff8844'],
      ['GULF RESERVES',   `${(data.gulfReserves / 1_000_000).toFixed(1)} Mbbl`,   '#ffdd88'],
      ['SILOS DESTROYED', `${data.silosDestroyed}`,                               '#88ffff'],
      ['SHIPS PROTECTED', `${data.shipsProtected}`,                               '#88ffcc'],
      ['SHIPS SUNK',      `${data.shipsSunk}`,                                    '#ff8888'],
    ];

    rows.forEach(([label, value, color], i) => {
      const y = 82 + i * 12;
      this.add.text(24, y, label, {
        fontSize: '4px', color: '#aabbcc', fontFamily: 'monospace'
      });
      this.add.text(GAME_WIDTH - 24, y, value, {
        fontSize: '4px', color, fontFamily: 'monospace'
      }).setOrigin(1, 0);
    });

    // Oil efficiency rating
    const totalOil = data.oilTransported + data.oilLost;
    const efficiency = totalOil > 0
      ? Math.round((data.oilTransported / totalOil) * 100)
      : 0;
    const effColor = efficiency >= 75 ? '#44ff44' : efficiency >= 50 ? '#ffdd00' : '#ff4444';

    this.add.text(GAME_WIDTH / 2, 162, `OIL TRANSIT EFFICIENCY: ${efficiency}%`, {
      fontSize: '5px', color: effColor, fontFamily: 'monospace'
    }).setOrigin(0.5);

    // Retry button
    const retry = this.add.rectangle(GAME_WIDTH / 2 - 55, 188, 90, 18, 0x225522, 0.9)
      .setStrokeStyle(1, 0x44ff44, 0.8)
      .setInteractive();
    this.add.text(GAME_WIDTH / 2 - 55, 188, '▶ RETRY', {
      fontSize: '6px', color: '#44ff44', fontFamily: 'monospace'
    }).setOrigin(0.5);

    retry.on('pointerdown', () => this.scene.start('GameScene'));

    // Menu button
    const menu = this.add.rectangle(GAME_WIDTH / 2 + 55, 188, 90, 18, 0x222244, 0.9)
      .setStrokeStyle(1, 0x8888ff, 0.8)
      .setInteractive();
    this.add.text(GAME_WIDTH / 2 + 55, 188, '◀ MENU', {
      fontSize: '6px', color: '#8888ff', fontFamily: 'monospace'
    }).setOrigin(0.5);

    menu.on('pointerdown', () => this.scene.start('MenuScene'));
  }

  create(): void {
    // create() is called after init(), content is built there
  }
}

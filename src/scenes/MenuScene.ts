import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';

export class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create(): void {
    // Sky gradient
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0a0a1e).setOrigin(0, 0);
    // Water shimmer
    for (let y = GAME_HEIGHT * 0.4; y < GAME_HEIGHT; y += 6) {
      this.add.rectangle(0, y, GAME_WIDTH, 3, 0x1a3a8a,
        0.06 + (y / GAME_HEIGHT) * 0.25).setOrigin(0, 0);
    }

    // US flag accent bar at top
    this.add.rectangle(0, 0, GAME_WIDTH, 4, 0xcc2222).setOrigin(0, 0);
    this.add.rectangle(0, 4, GAME_WIDTH, 4, 0xffffff).setOrigin(0, 0);
    this.add.rectangle(0, 8, GAME_WIDTH, 4, 0x2244aa).setOrigin(0, 0);

    // Title
    this.add.text(GAME_WIDTH / 2, 60, 'HORMUZ', {
      fontSize: '28px', color: '#ff4444', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 92, 'DEFENDER', {
      fontSize: '18px', color: '#ffcc00', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 116, 'Protect the strait. Secure the oil.', {
      fontSize: '5px', color: '#8899aa', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Divider
    this.add.rectangle(20, 132, GAME_WIDTH - 40, 1, 0x334455).setOrigin(0, 0);

    // Mission briefing
    this.add.text(GAME_WIDTH / 2, 144, 'MISSION BRIEFING', {
      fontSize: '6px', color: '#ffdd88', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const lines = [
      '• Bomb silos before they fire',
      '• Protect oil tankers in the strait',
      '• Defend Gulf cities from missiles',
    ];
    lines.forEach((l, i) => {
      this.add.text(GAME_WIDTH / 2, 160 + i * 14, l, {
        fontSize: '5px', color: '#aaccaa', fontFamily: 'monospace',
      }).setOrigin(0.5);
    });

    // Controls
    this.add.rectangle(20, 212, GAME_WIDTH - 40, 1, 0x334455).setOrigin(0, 0);
    this.add.text(GAME_WIDTH / 2, 222, 'CONTROLS', {
      fontSize: '6px', color: '#ffdd88', fontFamily: 'monospace',
    }).setOrigin(0.5);
    [
      'TAP — move aircraft',
      'TAP SILO — intercept',
      'DOUBLE-TAP SILO — missile strike',
      '💣 BOMB / 🚀 MISSILE buttons',
    ].forEach((l, i) => {
      this.add.text(GAME_WIDTH / 2, 236 + i * 13, l, {
        fontSize: '4px', color: '#8899aa', fontFamily: 'monospace',
      }).setOrigin(0.5);
    });

    // START button
    const btn = this.add.rectangle(GAME_WIDTH / 2, 330, 160, 26, 0x225522, 0.9)
      .setStrokeStyle(1, 0x44ff44, 0.9).setInteractive();
    this.add.text(GAME_WIDTH / 2, 330, '▶  START MISSION', {
      fontSize: '8px', color: '#44ff44', fontFamily: 'monospace',
    }).setOrigin(0.5);

    btn.on('pointerdown', () => this.scene.start('GameScene'));
    btn.on('pointerover', () => btn.setFillStyle(0x336633));
    btn.on('pointerout',  () => btn.setFillStyle(0x225522));

    // Blink hint
    const blink = this.add.text(GAME_WIDTH / 2, 366, 'TAP ANYWHERE TO BEGIN', {
      fontSize: '4px', color: '#556655', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.tweens.add({ targets: blink, alpha: 0, duration: 700, yoyo: true, repeat: -1 });

    this.input.once('pointerdown', () => this.scene.start('GameScene'));
  }
}

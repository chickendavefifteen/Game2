import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    // Background — dark blue sky / sea
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0a0a1e).setOrigin(0, 0);

    // Animated "water" rows
    for (let y = GAME_HEIGHT * 0.35; y < GAME_HEIGHT; y += 4) {
      const alpha = 0.1 + (y / GAME_HEIGHT) * 0.3;
      this.add.rectangle(0, y, GAME_WIDTH, 2, 0x1a3a8a, alpha).setOrigin(0, 0);
    }

    // Title
    this.add.text(GAME_WIDTH / 2, 50, 'HORMUZ', {
      fontSize: '24px',
      color: '#ff4444',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 72, 'DEFENDER', {
      fontSize: '16px',
      color: '#ffcc00',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 100, 'Protect the strait. Secure the oil.', {
      fontSize: '5px',
      color: '#aabbcc',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Objective text
    const objLines = [
      'MISSION BRIEFING:',
      '• Destroy missile silos before they launch',
      '• Protect oil tankers transiting the strait',
      '• Defend Gulf state cities from attack',
      '• Monitor Gulf oil reserves',
    ];
    objLines.forEach((line, i) => {
      this.add.text(GAME_WIDTH / 2, 130 + i * 10, line, {
        fontSize: '4px',
        color: i === 0 ? '#ffdd88' : '#ccddcc',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
    });

    // Controls hint
    this.add.text(GAME_WIDTH / 2, 196, 'TAP to move aircraft', {
      fontSize: '4px', color: '#8899aa', fontFamily: 'monospace'
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 204, 'TAP SILO to intercept • DOUBLE-TAP to missile strike', {
      fontSize: '4px', color: '#8899aa', fontFamily: 'monospace'
    }).setOrigin(0.5);

    // START button
    const btnBg = this.add.rectangle(GAME_WIDTH / 2, 234, 100, 18, 0x225522, 0.9)
      .setStrokeStyle(1, 0x44ff44, 0.8)
      .setInteractive();

    this.add.text(GAME_WIDTH / 2, 234, '▶  START MISSION', {
      fontSize: '6px',
      color: '#44ff44',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    btnBg.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(0x336633);
    });
    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(0x225522);
    });

    // Blinking prompt
    const blink = this.add.text(GAME_WIDTH / 2, 256, 'TAP ANYWHERE TO BEGIN', {
      fontSize: '4px', color: '#556655', fontFamily: 'monospace'
    }).setOrigin(0.5);
    this.tweens.add({ targets: blink, alpha: 0, duration: 700, yoyo: true, repeat: -1 });

    // Tap anywhere fallback
    this.input.once('pointerdown', () => {
      this.scene.start('GameScene');
    });
  }
}

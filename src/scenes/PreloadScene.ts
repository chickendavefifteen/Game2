import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // Progress bar
    const barBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 200, 12, 0x222222);
    const bar = this.add.rectangle(GAME_WIDTH / 2 - 100, GAME_HEIGHT / 2, 0, 10, 0x22aa22);
    bar.setOrigin(0, 0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 16, 'LOADING...', {
      fontSize: '6px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.load.on('progress', (v: number) => {
      bar.width = Math.round(200 * v);
    });

    // Spritesheets
    this.load.spritesheet('aircraft', 'assets/sprites/aircraft.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('silo', 'assets/sprites/silo.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('explosion', 'assets/sprites/explosion.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('ship', 'assets/sprites/ship.png', { frameWidth: 32, frameHeight: 16 });
    this.load.spritesheet('enemy_missile', 'assets/sprites/enemy_missile.png', { frameWidth: 8, frameHeight: 12 });
    this.load.spritesheet('aircraft_missile', 'assets/sprites/aircraft_missile.png', { frameWidth: 8, frameHeight: 8 });
    this.load.spritesheet('terrain', 'assets/sprites/terrain.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('oil_slick', 'assets/sprites/oil_slick.png', { frameWidth: 16, frameHeight: 8 });

    // Single sprites
    this.load.image('bomb', 'assets/sprites/bomb.png');
    this.load.image('reticle', 'assets/sprites/reticle.png');
    this.load.image('move_indicator', 'assets/sprites/move_indicator.png');
    this.load.image('ui', 'assets/sprites/ui.png');

    void barBg;
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}

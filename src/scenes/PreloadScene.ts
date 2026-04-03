import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';

export class PreloadScene extends Phaser.Scene {
  constructor() { super({ key: 'PreloadScene' }); }

  preload(): void {
    const barBg = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, 180, 10, 0x222222);
    const bar   = this.add.rectangle(GAME_WIDTH/2 - 90, GAME_HEIGHT/2, 0, 8, 0x22aa22).setOrigin(0, 0.5);
    this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 18, 'LOADING...', {
      fontSize: '7px', color: '#ffffff', fontFamily: 'monospace'
    }).setOrigin(0.5);
    this.load.on('progress', (v: number) => { bar.width = Math.round(180 * v); });
    void barBg;

    // Spritesheets — cartoony art, new frame sizes
    this.load.spritesheet('aircraft',         'assets/sprites/aircraft.png',         { frameWidth: 48,  frameHeight: 48 });
    this.load.spritesheet('silo',             'assets/sprites/silo.png',             { frameWidth: 48,  frameHeight: 48 });
    this.load.spritesheet('explosion',        'assets/sprites/explosion.png',        { frameWidth: 48,  frameHeight: 48 });
    this.load.spritesheet('ship',             'assets/sprites/ship.png',             { frameWidth: 80,  frameHeight: 36 });
    this.load.spritesheet('enemy_missile',    'assets/sprites/enemy_missile.png',    { frameWidth: 20,  frameHeight: 36 });
    this.load.spritesheet('aircraft_missile', 'assets/sprites/aircraft_missile.png', { frameWidth: 14,  frameHeight: 24 });
    this.load.spritesheet('terrain',          'assets/sprites/terrain.png',          { frameWidth: 16,  frameHeight: 16 });
    this.load.spritesheet('oil_slick',        'assets/sprites/oil_slick.png',        { frameWidth: 32,  frameHeight: 10 });

    this.load.image('bomb',           'assets/sprites/bomb.png');
    this.load.image('reticle',        'assets/sprites/reticle.png');
    this.load.image('move_indicator', 'assets/sprites/move_indicator.png');
    this.load.image('ui',             'assets/sprites/ui.png');
  }

  create(): void { this.scene.start('MenuScene'); }
}

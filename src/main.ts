import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { HUDScene } from './scenes/HUDScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GAME_WIDTH, GAME_HEIGHT } from './config/GameConfig';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,

  // Critical pixel art settings
  pixelArt: true,          // sets antialias: false and roundPixels: true
  backgroundColor: '#000000',

  parent: 'game',

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { x: 0, y: 0 },
    },
  },

  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    GameScene,
    HUDScene,
    GameOverScene,
  ],
};

// GameScene launches HUDScene as a parallel overlay scene
// This is handled inside GameScene.create() via:
//   this.scene.launch('HUDScene')
// (HUDScene runs on top without being affected by game camera)

const game = new Phaser.Game(config);

// Prevent context menu on long press (mobile)
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Prevent default touch behaviors that interfere with game
document.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

export default game;

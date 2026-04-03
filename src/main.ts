import Phaser from 'phaser';
import { BootScene }     from './scenes/BootScene';
import { PreloadScene }  from './scenes/PreloadScene';
import { MenuScene }     from './scenes/MenuScene';
import { GameScene }     from './scenes/GameScene';
import { HUDScene }      from './scenes/HUDScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GAME_WIDTH, GAME_HEIGHT } from './config/GameConfig';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width:  GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: false,
  backgroundColor: '#0a1428',
  parent: 'game',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false, gravity: { x: 0, y: 0 } },
  },
  scene: [BootScene, PreloadScene, MenuScene, GameScene, HUDScene, GameOverScene],
};

new Phaser.Game(config);

document.addEventListener('contextmenu',  e => e.preventDefault());
document.addEventListener('touchstart',   e => e.preventDefault(), { passive: false });
document.addEventListener('touchmove',    e => e.preventDefault(), { passive: false });

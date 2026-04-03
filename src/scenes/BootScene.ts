import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Load only the minimal assets needed for the loading screen
    // (nothing for now — PreloadScene handles everything)
  }

  create(): void {
    this.scene.start('PreloadScene');
  }
}

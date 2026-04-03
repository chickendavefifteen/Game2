import Phaser from 'phaser';
import { clampToPixel } from '../utils/PixelPerfect';

export class Explosion extends Phaser.GameObjects.Sprite {
  active: boolean = false;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'explosion');
    scene.add.existing(this);
    this.setVisible(false);
    this.setDepth(10);
  }

  playAt(x: number, y: number, onComplete?: () => void): void {
    this.active = true;
    this.setPosition(Math.round(x), Math.round(y));
    this.setVisible(true);
    this.setFrame(0);

    this.scene.tweens.addCounter({
      from: 0,
      to: 7,
      duration: 350,
      ease: 'Linear',
      onUpdate: (tween) => {
        const frame = Math.floor(tween.getValue() as number);
        this.setFrame(Math.min(frame, 7));
        clampToPixel(this);
      },
      onComplete: () => {
        this.setVisible(false);
        this.active = false;
        if (onComplete) onComplete();
      }
    });
  }
}

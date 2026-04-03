import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/GameConfig';

export class AlertBanner {
  private scene: Phaser.Scene;
  private text: Phaser.GameObjects.Text;
  private bg: Phaser.GameObjects.Rectangle;
  private tween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.bg = scene.add.rectangle(GAME_WIDTH / 2, 24, GAME_WIDTH, 14, 0xcc0000, 0.85)
      .setDepth(50)
      .setVisible(false);

    this.text = scene.add.text(GAME_WIDTH / 2, 24, '', {
      fontSize: '6px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 0.5).setDepth(51).setVisible(false);
  }

  show(message: string, color: number = 0xcc0000, durationMs: number = 2000): void {
    if (this.tween) this.tween.stop();

    this.bg.setFillStyle(color);
    this.bg.setVisible(true);
    this.text.setText(message);
    this.text.setVisible(true);
    this.bg.setAlpha(1);
    this.text.setAlpha(1);

    this.tween = this.scene.tweens.add({
      targets: [this.bg, this.text],
      alpha: 0,
      duration: 400,
      delay: durationMs - 400,
      onComplete: () => {
        this.bg.setVisible(false);
        this.text.setVisible(false);
      }
    });
  }
}

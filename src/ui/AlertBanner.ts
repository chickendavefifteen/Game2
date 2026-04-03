import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/GameConfig';

export class AlertBanner {
  private scene: Phaser.Scene;
  private text: Phaser.GameObjects.Text;
  private bg:   Phaser.GameObjects.Rectangle;
  private tween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.bg   = scene.add.rectangle(GAME_WIDTH / 2, 150, GAME_WIDTH, 16, 0xcc0000, 0.88)
      .setDepth(50).setVisible(false);
    this.text = scene.add.text(GAME_WIDTH / 2, 150, '', {
      fontSize: '6px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(51).setVisible(false);
  }

  show(message: string, color = 0xcc0000, durationMs = 2000): void {
    if (this.tween) this.tween.stop();
    this.bg.setFillStyle(color).setAlpha(1).setVisible(true);
    this.text.setText(message).setAlpha(1).setVisible(true);
    this.tween = this.scene.tweens.add({
      targets: [this.bg, this.text],
      alpha: 0, duration: 350,
      delay: durationMs - 350,
      onComplete: () => { this.bg.setVisible(false); this.text.setVisible(false); },
    });
  }
}

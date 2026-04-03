import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/GameConfig';

export class AlertBanner {
  private scene: Phaser.Scene;
  private text: Phaser.GameObjects.Text;
  private bg:   Phaser.GameObjects.Rectangle;
  private tween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Sits just below the HUD bars (~56px from top)
    this.bg = scene.add.rectangle(GAME_WIDTH / 2, 66, GAME_WIDTH, 18, 0xcc0000, 0.92)
      .setDepth(55).setVisible(false);

    this.text = scene.add.text(GAME_WIDTH / 2, 66, '', {
      fontSize: '7px',
      color: '#ffffff',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(56).setVisible(false);
  }

  show(message: string, color = 0xcc0000, durationMs = 2000): void {
    if (this.tween) this.tween.stop();
    this.bg.setFillStyle(color).setAlpha(1).setVisible(true);
    this.text.setText(message).setAlpha(1).setVisible(true);
    this.tween = this.scene.tweens.add({
      targets: [this.bg, this.text],
      alpha: 0,
      duration: 350,
      delay: durationMs - 350,
      onComplete: () => { this.bg.setVisible(false); this.text.setVisible(false); },
    });
  }
}

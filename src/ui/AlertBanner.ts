import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/GameConfig';

const BANNER_Y  = 60;   // centre Y — just below the top bar (top bar is 48px)
const BANNER_H  = 22;

export class AlertBanner {
  private scene: Phaser.Scene;
  private gfx:   Phaser.GameObjects.Graphics;
  private text:  Phaser.GameObjects.Text;
  private tween: Phaser.Tweens.Tween | null = null;
  private slideIn: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.gfx = scene.add.graphics()
      .setDepth(55).setVisible(false).setAlpha(0);

    this.text = scene.add.text(GAME_WIDTH / 2, BANNER_Y, '', {
      fontSize: '7px',
      color: '#ffffff',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(56).setVisible(false).setAlpha(0);
  }

  show(message: string, color = 0xcc0000, durationMs = 2000): void {
    if (this.tween)    this.tween.stop();
    if (this.slideIn)  this.slideIn.stop();

    // Draw the rounded banner
    this.gfx.clear();
    // shadow
    this.gfx.fillStyle(0x000000, 0.45);
    this.gfx.fillRoundedRect(2, BANNER_Y - BANNER_H / 2 + 2, GAME_WIDTH - 4, BANNER_H, 5);
    // fill
    this.gfx.fillStyle(color, 0.94);
    this.gfx.fillRoundedRect(0, BANNER_Y - BANNER_H / 2, GAME_WIDTH, BANNER_H, 5);
    // top highlight
    this.gfx.fillStyle(0xffffff, 0.12);
    this.gfx.fillRoundedRect(1, BANNER_Y - BANNER_H / 2 + 1, GAME_WIDTH - 2, BANNER_H / 2, 5);
    // border
    this.gfx.lineStyle(1.5, 0xffffff, 0.2);
    this.gfx.strokeRoundedRect(0, BANNER_Y - BANNER_H / 2, GAME_WIDTH, BANNER_H, 5);

    this.gfx.setVisible(true).setAlpha(0);
    this.text.setText(message).setVisible(true).setAlpha(0);

    // Slide in (y offset) + fade in
    const targets = [this.gfx, this.text];
    this.slideIn = this.scene.tweens.add({
      targets,
      alpha: 1,
      y: { from: BANNER_Y - 6, to: 0 },   // relative offset slide
      duration: 160,
      ease: 'Back.easeOut',
    });

    this.tween = this.scene.tweens.add({
      targets,
      alpha: 0,
      duration: 300,
      delay: durationMs - 300,
      onComplete: () => {
        this.gfx.setVisible(false);
        this.text.setVisible(false);
      },
    });
  }
}

import Phaser from 'phaser';

const W = 36;  // bar width  (wider, more visible on small screens)
const H = 7;   // bar height (taller for readability)
const R = 3;   // corner radius

export class SiloTimer {
  private gfx:  Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private cx: number;
  private cy: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.cx = Math.round(x);
    this.cy = Math.round(y);

    this.gfx = scene.add.graphics().setDepth(22);

    this.label = scene.add.text(this.cx, this.cy - 10, '', {
      fontSize: '6px',
      color: '#ffffff',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(23);

    this.setVisible(false);
  }

  update(ratio: number, warning: boolean, secondsLeft?: number): void {
    this.gfx.clear();

    const flash = Math.floor(Date.now() / 200) % 2 === 0;
    const bx = this.cx - W / 2;
    const by = this.cy;

    // Drop shadow
    this.gfx.fillStyle(0x000000, 0.55);
    this.gfx.fillRoundedRect(bx - 1, by + 1, W + 2, H + 2, R);

    // Track background
    this.gfx.fillStyle(0x111118, 0.92);
    this.gfx.fillRoundedRect(bx, by, W, H, R);

    // Filled bar — gradient-style via two tones
    const fillW = Math.max(2, Math.round(W * Math.max(0, ratio)));
    if (fillW > 0) {
      let col1: number, col2: number;
      if (warning) {
        col1 = flash ? 0xff0000 : 0xff6600;
        col2 = flash ? 0xff4400 : 0xff9900;
      } else if (ratio > 0.55) {
        col1 = 0x118833; col2 = 0x22dd55;
      } else if (ratio > 0.25) {
        col1 = 0xaa7700; col2 = 0xffcc00;
      } else {
        col1 = 0xaa1100; col2 = 0xff3300;
      }
      this.gfx.fillGradientStyle(col1, col2, col1, col2, 1);
      this.gfx.fillRoundedRect(bx, by, fillW, H, R);
      // gloss top strip
      this.gfx.fillStyle(0xffffff, 0.15);
      this.gfx.fillRoundedRect(bx + 1, by + 1, fillW - 2, H / 2, R);
    }

    // Border — glows red when warning
    this.gfx.lineStyle(1.5, warning && flash ? 0xff4400 : 0x334455, 0.9);
    this.gfx.strokeRoundedRect(bx, by, W, H, R);

    // Countdown label
    if (secondsLeft !== undefined) {
      const secs = Math.ceil(secondsLeft);
      this.label.setText(`${secs}s`);
      if (warning) {
        this.label.setColor(flash ? '#ff2200' : '#ffaa00');
        this.label.setScale(flash ? 1.1 : 1.0);
      } else {
        this.label.setColor('#ffffff');
        this.label.setScale(1.0);
      }
    }
  }

  setVisible(v: boolean): void {
    this.gfx.setVisible(v);
    this.label.setVisible(v);
  }

  destroy(fromScene?: boolean): void {
    this.gfx.destroy(fromScene);
    this.label.destroy(fromScene);
  }
}

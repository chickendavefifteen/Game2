import Phaser from 'phaser';

const W = 28;  // bar width
const H = 5;   // bar height

export class SiloTimer {
  private gfx:  Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private cx: number;
  private cy: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.cx = Math.round(x);
    this.cy = Math.round(y);

    this.gfx = scene.add.graphics().setDepth(22);

    this.label = scene.add.text(this.cx, this.cy - 8, '', {
      fontSize: '5px',
      color: '#ffffff',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(23);

    this.setVisible(false);
  }

  update(ratio: number, warning: boolean, secondsLeft?: number): void {
    this.gfx.clear();

    // Shadow
    this.gfx.fillStyle(0x000000, 0.7);
    this.gfx.fillRect(this.cx - W / 2 - 1, this.cy - 1, W + 2, H + 2);

    // Background track
    this.gfx.fillStyle(0x222222);
    this.gfx.fillRect(this.cx - W / 2, this.cy, W, H);

    // Fill
    const flash = Math.floor(Date.now() / 200) % 2 === 0;
    let color: number;
    if (warning) {
      color = flash ? 0xff2200 : 0xff8800;
    } else {
      color = ratio > 0.5 ? 0x22cc22 : ratio > 0.25 ? 0xddaa00 : 0xcc2200;
    }
    this.gfx.fillStyle(color);
    this.gfx.fillRect(this.cx - W / 2, this.cy, Math.round(W * ratio), H);

    // Border
    this.gfx.lineStyle(1, warning && flash ? 0xff4400 : 0x555555);
    this.gfx.strokeRect(this.cx - W / 2, this.cy, W, H);

    // Countdown number
    if (secondsLeft !== undefined) {
      this.label.setText(`${Math.ceil(secondsLeft)}s`);
      this.label.setColor(warning ? (flash ? '#ff4400' : '#ffaa00') : '#ffffff');
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

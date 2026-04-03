import Phaser from 'phaser';

export class SiloTimer extends Phaser.GameObjects.Container {
  private bar: Phaser.GameObjects.Graphics;
  private readonly W = 14;
  private readonly H = 2;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, Math.round(x), Math.round(y));
    this.bar = scene.add.graphics();
    this.add(this.bar);
    scene.add.existing(this);
    this.setDepth(21);
  }

  update(ratio: number, warning: boolean): void {
    this.bar.clear();

    // Background
    this.bar.fillStyle(0x222222);
    this.bar.fillRect(this.x - this.W / 2, this.y, this.W, this.H);

    // Fill color based on ratio
    const color = warning
      ? (Math.floor(Date.now() / 250) % 2 === 0 ? 0xff2200 : 0xff8800)
      : ratio > 0.5 ? 0x22aa22 : ratio > 0.25 ? 0xddaa00 : 0xcc2200;

    this.bar.fillStyle(color);
    this.bar.fillRect(this.x - this.W / 2, this.y, Math.round(this.W * ratio), this.H);
  }

  destroy(fromScene?: boolean): void {
    this.bar.destroy(fromScene);
    super.destroy(fromScene);
  }
}

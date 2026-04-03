import Phaser from 'phaser';

export class OilSlick {
  active: boolean = false;
  private gfx: Phaser.GameObjects.Graphics;
  private scene: Phaser.Scene;
  private cx: number = 0;
  private cy: number = 0;
  private radius: number = 0;
  private maxRadius: number = 20;
  private expandTimer: number = 0;
  private fadeTimer: number = 0;
  private expanding: boolean = false;
  private fading: boolean = false;
  private alpha: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.gfx = scene.add.graphics().setDepth(5);
    this.gfx.setVisible(false);
  }

  spawn(x: number, y: number): void {
    this.active = true;
    this.cx = Math.round(x);
    this.cy = Math.round(y);
    this.radius = 2;
    this.alpha = 0.85;
    this.expanding = true;
    this.fading = false;
    this.expandTimer = 0;
    this.gfx.setVisible(true);
    this.draw();
  }

  update(delta: number): void {
    if (!this.active) return;

    if (this.expanding) {
      this.expandTimer += delta;
      this.radius = 2 + (this.maxRadius - 2) * Math.min(this.expandTimer / 1500, 1);
      if (this.expandTimer >= 1500) {
        this.expanding = false;
        this.fading = true;
        this.fadeTimer = 0;
      }
    } else if (this.fading) {
      this.fadeTimer += delta;
      this.alpha = 0.85 * (1 - Math.min(this.fadeTimer / 3000, 1));
      if (this.fadeTimer >= 3000) {
        this.active = false;
        this.gfx.setVisible(false);
        return;
      }
    }

    this.draw();
  }

  private draw(): void {
    this.gfx.clear();
    const r = Math.round(this.radius);
    const ry = Math.round(r * 0.4); // ellipse (wide, flat on water)

    for (let y = -ry; y <= ry; y++) {
      for (let x = -r; x <= r; x++) {
        const inEllipse = (x * x) / (r * r) + (y * y) / (ry * ry) <= 1;
        if (!inEllipse) continue;

        // Rainbow sheen — hue shifts across the slick
        const t = (x + r) / (2 * r);
        const hue = 180 + t * 80;
        this.gfx.fillStyle(
          Phaser.Display.Color.HSLToColor(hue / 360, 0.7, 0.25).color,
          this.alpha
        );
        this.gfx.fillRect(this.cx + x, this.cy + y, 1, 1);
      }
    }
  }

  destroy(): void {
    this.gfx.destroy();
  }
}

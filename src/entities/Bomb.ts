import Phaser from 'phaser';
import { BALANCE } from '../config/BalanceConfig';
import { clampToPixel } from '../utils/PixelPerfect';

export class Bomb extends Phaser.GameObjects.Sprite {
  active: boolean = false;
  targetX: number = 0;
  targetY: number = 0;
  onArrival?: () => void;

  private speed: number = BALANCE.aircraft.bombSpeed;
  private dx: number = 0;
  private dy: number = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'bomb');
    scene.physics.add.existing(this);
    scene.add.existing(this);
    this.setVisible(false);
    this.setDepth(8);
  }

  launch(fromX: number, fromY: number, toX: number, toY: number, onArrival: () => void): void {
    this.active = true;
    this.setPosition(Math.round(fromX), Math.round(fromY));
    this.setVisible(true);
    this.targetX = Math.round(toX);
    this.targetY = Math.round(toY);
    this.onArrival = onArrival;

    const dist = Phaser.Math.Distance.Between(fromX, fromY, toX, toY);
    if (dist > 0) {
      this.dx = ((toX - fromX) / dist) * this.speed;
      this.dy = ((toY - fromY) / dist) * this.speed;
    }
  }

  update(delta: number): void {
    if (!this.active) return;

    const dt = delta / 1000;
    const newX = this.x + this.dx * dt;
    const newY = this.y + this.dy * dt;

    const dist = Phaser.Math.Distance.Between(newX, newY, this.targetX, this.targetY);
    if (dist < 4) {
      this.setPosition(this.targetX, this.targetY);
      this.setVisible(false);
      this.active = false;
      if (this.onArrival) this.onArrival();
      return;
    }

    this.setPosition(Math.round(newX), Math.round(newY));
    clampToPixel(this);
  }

  get physicsBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }
}

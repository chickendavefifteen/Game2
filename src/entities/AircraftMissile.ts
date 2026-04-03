import Phaser from 'phaser';
import { BALANCE } from '../config/BalanceConfig';
import { clampToPixel } from '../utils/PixelPerfect';

export class AircraftMissile extends Phaser.GameObjects.Sprite {
  active: boolean = false;
  targetX: number = 0;
  targetY: number = 0;
  onArrival?: () => void;

  private speed: number = BALANCE.aircraft.missileSpeed;
  private animFrame: number = 0;
  private animTimer: number = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'aircraft_missile');
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
    this.setFrame(0);
  }

  update(delta: number): void {
    if (!this.active) return;

    const dt = delta / 1000;

    // Animate exhaust
    this.animTimer += delta;
    if (this.animTimer > 100) {
      this.animTimer = 0;
      this.animFrame = 1 - this.animFrame;
      this.setFrame(this.animFrame);
    }

    // Homing behavior — fly toward target
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 6) {
      this.setVisible(false);
      this.active = false;
      if (this.onArrival) this.onArrival();
      return;
    }

    const nx = (dx / dist) * this.speed * dt;
    const ny = (dy / dist) * this.speed * dt;
    this.setPosition(Math.round(this.x + nx), Math.round(this.y + ny));
    clampToPixel(this);

    // Rotate to face travel direction
    this.setRotation(Math.atan2(dy, dx) - Math.PI / 2);
  }
}

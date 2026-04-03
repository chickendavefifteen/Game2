import Phaser from 'phaser';
import { clampToPixel } from '../utils/PixelPerfect';
import { EventBus } from '../utils/EventBus';

export class EnemyMissile extends Phaser.GameObjects.Sprite {
  active: boolean = false;
  targetX: number = 0;
  targetY: number = 0;
  targetType: 'ship' | 'city' = 'city';
  targetId: number = -1;
  private speed: number = 70;
  private animFrame: number = 0;
  private animTimer: number = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'enemy_missile');
    scene.physics.add.existing(this);
    scene.add.existing(this);
    this.setVisible(false);
    this.setDepth(9);
  }

  launch(
    fromX: number, fromY: number,
    toX: number, toY: number,
    targetType: 'ship' | 'city',
    targetId: number
  ): void {
    this.active = true;
    this.setPosition(Math.round(fromX), Math.round(fromY));
    this.setVisible(true);
    this.targetX = Math.round(toX);
    this.targetY = Math.round(toY);
    this.targetType = targetType;
    this.targetId = targetId;
    this.setFrame(0);
  }

  update(delta: number): void {
    if (!this.active) return;

    const dt = delta / 1000;

    // Animate exhaust
    this.animTimer += delta;
    if (this.animTimer > 120) {
      this.animTimer = 0;
      this.animFrame = 1 - this.animFrame;
      this.setFrame(this.animFrame);
    }

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 6) {
      this.setVisible(false);
      this.active = false;

      if (this.targetType === 'city') {
        EventBus.emit('cityHit', { cityId: this.targetId, oilStorageValue: 0, hp: 0 });
      } else {
        EventBus.emit('shipSunk', { shipId: this.targetId, cargoBarrels: 0, x: this.targetX, y: this.targetY });
      }
      return;
    }

    const nx = (dx / dist) * this.speed * dt;
    const ny = (dy / dist) * this.speed * dt;
    this.setPosition(Math.round(this.x + nx), Math.round(this.y + ny));
    clampToPixel(this);
    this.setRotation(Math.atan2(dy, dx) - Math.PI / 2);
  }

  get physicsBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }
}

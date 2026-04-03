import Phaser from 'phaser';
import { BALANCE } from '../config/BalanceConfig';
import { GAME_WIDTH, GAME_HEIGHT, WATER_ROWS, TILE_SIZE } from '../config/GameConfig';
import { clampToPixel } from '../utils/PixelPerfect';
import { EventBus } from '../utils/EventBus';

export class Aircraft extends Phaser.GameObjects.Sprite {
  bombs: number;
  missiles: number;

  private targetX: number;
  private targetY: number;
  private isMoving: boolean = false;
  private speed: number = BALANCE.aircraft.speed;
  private bombCooldownMs: number = 0;
  private moveIndicator: Phaser.GameObjects.Sprite;
  private animTimer: number = 0;
  private animFrame: number = 0;
  private lockedSiloId: number = -1;

  // Clamp aircraft to water zone
  private readonly MIN_Y = WATER_ROWS.start * TILE_SIZE;
  private readonly MAX_Y = WATER_ROWS.end * TILE_SIZE + TILE_SIZE;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, Math.round(x), Math.round(y), 'aircraft', 0);
    this.bombs = BALANCE.aircraft.startingBombs;
    this.missiles = BALANCE.aircraft.startingMissiles;
    this.targetX = Math.round(x);
    this.targetY = Math.round(y);

    scene.add.existing(this);
    this.setDepth(12);

    this.moveIndicator = scene.add.sprite(0, 0, 'move_indicator').setDepth(11).setVisible(false);
  }

  moveTo(worldX: number, worldY: number): void {
    this.targetX = Math.round(Phaser.Math.Clamp(worldX, 8, GAME_WIDTH - 8));
    this.targetY = Math.round(Phaser.Math.Clamp(worldY, this.MIN_Y, this.MAX_Y));
    this.isMoving = true;
    this.moveIndicator.setPosition(this.targetX, this.targetY);
    this.moveIndicator.setVisible(true);
  }

  lockSilo(siloId: number, siloX: number, siloY: number): void {
    this.lockedSiloId = siloId;
    this.moveTo(siloX, siloY + TILE_SIZE * 3);
  }

  dropBomb(targetX: number, targetY: number): boolean {
    if (this.bombs <= 0 || this.bombCooldownMs > 0) return false;
    this.bombs--;
    this.bombCooldownMs = BALANCE.aircraft.bombCooldownMs;
    EventBus.emit('bombDropped', {});
    return true;
  }

  fireMissile(): boolean {
    if (this.missiles <= 0) return false;
    this.missiles--;
    EventBus.emit('missileFireed', {});
    return true;
  }

  update(delta: number): void {
    if (this.bombCooldownMs > 0) {
      this.bombCooldownMs = Math.max(0, this.bombCooldownMs - delta);
    }

    if (this.isMoving) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 2) {
        this.setPosition(this.targetX, this.targetY);
        this.isMoving = false;
        this.moveIndicator.setVisible(false);
        clampToPixel(this);
      } else {
        const dt = delta / 1000;
        const move = this.speed * dt;
        const ratio = Math.min(move / dist, 1);
        this.setPosition(
          Math.round(this.x + dx * ratio),
          Math.round(this.y + dy * ratio)
        );
        clampToPixel(this);
      }
    }

    // Animate engine exhaust
    this.animTimer += delta;
    if (this.animTimer > 80) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
      this.setFrame(this.animFrame);
    }
  }

  isAtBombRange(targetX: number, targetY: number): boolean {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
    return dist <= BALANCE.aircraft.bombRange;
  }

  getLockedSiloId(): number {
    return this.lockedSiloId;
  }

  clearLock(): void {
    this.lockedSiloId = -1;
  }

  respawn(x: number, y: number): void {
    this.setPosition(Math.round(x), Math.round(y));
    this.targetX = Math.round(x);
    this.targetY = Math.round(y);
    this.isMoving = false;
    this.lockedSiloId = -1;
    this.moveIndicator.setVisible(false);
    this.setAlpha(1);
  }

  destroy(fromScene?: boolean): void {
    this.moveIndicator.destroy(fromScene);
    super.destroy(fromScene);
  }
}

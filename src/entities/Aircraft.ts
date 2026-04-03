import Phaser from 'phaser';
import { BALANCE } from '../config/BalanceConfig';
import { GAME_WIDTH, WATER_Y_MIN, WATER_Y_MAX } from '../config/GameConfig';
import { clampToPixel } from '../utils/PixelPerfect';

export class Aircraft extends Phaser.GameObjects.Sprite {
  bombs: number;
  missiles: number;

  private targetX: number;
  private targetY: number;
  private isMoving = false;
  private speed    = BALANCE.aircraft.speed;
  private bombCooldownMs = 0;
  private moveIndicator: Phaser.GameObjects.Sprite;
  private animTimer  = 0;
  private animFrame  = 0;
  private lockedSiloId = -1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, Math.round(x), Math.round(y), 'aircraft', 0);
    this.bombs   = BALANCE.aircraft.startingBombs;
    this.missiles = BALANCE.aircraft.startingMissiles;
    this.targetX = Math.round(x);
    this.targetY = Math.round(y);

    scene.add.existing(this);
    this.setDepth(12);

    this.moveIndicator = scene.add.sprite(0, 0, 'move_indicator').setDepth(11).setVisible(false);
  }

  moveTo(worldX: number, worldY: number): void {
    this.targetX = Math.round(Phaser.Math.Clamp(worldX, 16, GAME_WIDTH - 16));
    this.targetY = Math.round(Phaser.Math.Clamp(worldY, WATER_Y_MIN, WATER_Y_MAX));
    this.isMoving = true;
    this.moveIndicator.setPosition(this.targetX, this.targetY).setVisible(true);
  }

  lockSilo(siloId: number, siloX: number, siloY: number): void {
    this.lockedSiloId = siloId;
    // Fly to a position just south of (below) the silo
    this.moveTo(siloX, Math.min(siloY + 55, WATER_Y_MAX));
  }

  dropBomb(targetX: number, targetY: number): boolean {
    if (this.bombs <= 0 || this.bombCooldownMs > 0) return false;
    this.bombs--;
    this.bombCooldownMs = BALANCE.aircraft.bombCooldownMs;
    return true;
  }

  fireMissile(): boolean {
    if (this.missiles <= 0) return false;
    this.missiles--;
    return true;
  }

  update(delta: number): void {
    if (this.bombCooldownMs > 0) this.bombCooldownMs = Math.max(0, this.bombCooldownMs - delta);

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
        const dt    = delta / 1000;
        const move  = this.speed * dt;
        const ratio = Math.min(move / dist, 1);
        this.setPosition(
          Math.round(this.x + dx * ratio),
          Math.round(this.y + dy * ratio)
        );
        clampToPixel(this);
      }
    }

    // Animate engine exhaust frames
    this.animTimer += delta;
    if (this.animTimer > 80) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
      this.setFrame(this.animFrame);
    }
  }

  isAtBombRange(targetX: number, targetY: number): boolean {
    return Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY) <=
      BALANCE.aircraft.bombRange;
  }

  getLockedSiloId(): number { return this.lockedSiloId; }
  clearLock(): void { this.lockedSiloId = -1; }

  respawn(x: number, y: number): void {
    this.setPosition(Math.round(x), Math.round(y));
    this.targetX = Math.round(x);
    this.targetY = Math.round(y);
    this.isMoving     = false;
    this.lockedSiloId = -1;
    this.moveIndicator.setVisible(false);
    this.setAlpha(1);
  }

  destroy(fromScene?: boolean): void {
    this.moveIndicator.destroy(fromScene);
    super.destroy(fromScene);
  }
}

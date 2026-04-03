import Phaser from 'phaser';
import { Aircraft } from '../entities/Aircraft';
import { Silo } from '../entities/Silo';
import { TILE_SIZE } from '../config/GameConfig';

export interface InputCallbacks {
  onDropBomb: (targetX: number, targetY: number) => void;
  onFireMissile: (siloIndex: number) => void;
  onTapBombButton: () => void;
  onTapMissileButton: () => void;
}

export class InputSystem {
  private scene: Phaser.Scene;
  private aircraft: Aircraft;
  private silos: Silo[];
  private callbacks: InputCallbacks;

  private lastTapTime: number = 0;
  private lastTapX: number = 0;
  private lastTapY: number = 0;
  private readonly DOUBLE_TAP_MS = 350;
  private readonly SILO_TAP_RADIUS = TILE_SIZE * 2;

  private missileSelectMode: boolean = false;
  private reticle: Phaser.GameObjects.Sprite;

  constructor(
    scene: Phaser.Scene,
    aircraft: Aircraft,
    silos: Silo[],
    callbacks: InputCallbacks
  ) {
    this.scene = scene;
    this.aircraft = aircraft;
    this.silos = silos;
    this.callbacks = callbacks;

    this.reticle = scene.add.sprite(0, 0, 'reticle').setDepth(30).setVisible(false);

    // Listen for taps on the game world
    scene.input.on('pointerdown', this.handlePointerDown, this);
    scene.input.on('pointermove', this.handlePointerMove, this);
  }

  enterMissileSelectMode(): void {
    this.missileSelectMode = true;
    this.reticle.setVisible(true);
  }

  exitMissileSelectMode(): void {
    this.missileSelectMode = false;
    this.reticle.setVisible(false);
  }

  update(_delta: number): void {
    // Keyboard support (desktop testing)
    const keys = this.scene.input.keyboard;
    if (!keys) return;
    // Space = drop bomb
    // Keys are checked in GameScene via key objects
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const wx = pointer.worldX;
    const wy = pointer.worldY;

    // If in missile select mode, fire at nearest silo
    if (this.missileSelectMode) {
      const silo = this.findNearestActiveSilo(wx, wy, 60);
      if (silo !== null) {
        this.callbacks.onFireMissile(silo);
        this.exitMissileSelectMode();
      } else {
        this.exitMissileSelectMode();
      }
      return;
    }

    // Check for double-tap on a silo
    const now = Date.now();
    const distFromLastTap = Phaser.Math.Distance.Between(wx, wy, this.lastTapX, this.lastTapY);
    const isDoubleTap = now - this.lastTapTime < this.DOUBLE_TAP_MS && distFromLastTap < 20;

    this.lastTapTime = now;
    this.lastTapX = wx;
    this.lastTapY = wy;

    if (isDoubleTap) {
      // Double-tap on silo = fire missile
      const siloIdx = this.findNearestActiveSiloIndex(wx, wy, this.SILO_TAP_RADIUS * 2);
      if (siloIdx !== -1) {
        this.callbacks.onFireMissile(siloIdx);
        return;
      }
    }

    // Single tap: check if near a silo
    const siloIdx = this.findNearestActiveSiloIndex(wx, wy, this.SILO_TAP_RADIUS);
    if (siloIdx !== -1) {
      const silo = this.silos[siloIdx];
      this.aircraft.lockSilo(silo.siloId, silo.x, silo.y);
      return;
    }

    // Otherwise: move aircraft to tap location
    this.aircraft.moveTo(wx, wy);
    this.aircraft.clearLock();
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.missileSelectMode) {
      this.reticle.setPosition(Math.round(pointer.worldX), Math.round(pointer.worldY));
    }
  }

  private findNearestActiveSiloIndex(wx: number, wy: number, radius: number): number {
    let best = -1;
    let bestDist = radius;
    this.silos.forEach((silo, idx) => {
      if (silo.state === 'destroyed' || !silo.visible) return;
      const d = Phaser.Math.Distance.Between(wx, wy, silo.x, silo.y);
      if (d < bestDist) {
        bestDist = d;
        best = idx;
      }
    });
    return best;
  }

  private findNearestActiveSilo(wx: number, wy: number, radius: number): number | null {
    const idx = this.findNearestActiveSiloIndex(wx, wy, radius);
    return idx === -1 ? null : idx;
  }

  destroy(): void {
    this.scene.input.off('pointerdown', this.handlePointerDown, this);
    this.scene.input.off('pointermove', this.handlePointerMove, this);
    this.reticle.destroy();
  }
}

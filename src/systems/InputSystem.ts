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

  private readonly SILO_TAP_RADIUS = TILE_SIZE * 2.5;

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

  update(_delta: number): void {}

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const wx = pointer.worldX;
    const wy = pointer.worldY;

    // If in missile select mode, fire at nearest silo
    if (this.missileSelectMode) {
      const silo = this.findNearestActiveSiloIndex(wx, wy, 60);
      if (silo !== -1) {
        this.callbacks.onFireMissile(silo);
      }
      this.exitMissileSelectMode();
      return;
    }

    // Single tap near an active silo = fire missile immediately + lock for auto-bomb
    const siloIdx = this.findNearestActiveSiloIndex(wx, wy, this.SILO_TAP_RADIUS);
    if (siloIdx !== -1) {
      const silo = this.silos[siloIdx];
      // Fire missile if we have any
      this.callbacks.onFireMissile(siloIdx);
      // Also lock the silo so aircraft approaches for bomb follow-up
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

  destroy(): void {
    this.scene.input.off('pointerdown', this.handlePointerDown, this);
    this.scene.input.off('pointermove', this.handlePointerMove, this);
    this.reticle.destroy();
  }
}

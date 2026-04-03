import Phaser from 'phaser';
import { Ship } from '../entities/Ship';
import { SHIP_LANE_Y } from '../config/GameConfig';

export class ShipSpawnSystem {
  private scene: Phaser.Scene;
  private ships: Ship[];
  private spawnIntervalSeconds: number;
  private timer: number = 0;
  private nextLane: number = 0;
  private active: boolean = false;

  constructor(scene: Phaser.Scene, ships: Ship[], spawnIntervalSeconds: number) {
    this.scene = scene;
    this.ships = ships;
    this.spawnIntervalSeconds = spawnIntervalSeconds;
    this.timer = spawnIntervalSeconds * 500; // first ship comes at half interval
  }

  setInterval(seconds: number): void {
    this.spawnIntervalSeconds = seconds;
  }

  start(): void {
    this.active = true;
  }

  stop(): void {
    this.active = false;
  }

  update(delta: number): void {
    if (!this.active) return;

    this.timer += delta;
    if (this.timer >= this.spawnIntervalSeconds * 1000) {
      this.timer = 0;
      this.spawnShip();
    }
  }

  private spawnShip(): void {
    const ship = this.ships.find(s => !s.active);
    if (!ship) return;

    const laneY = SHIP_LANE_Y[this.nextLane % SHIP_LANE_Y.length];
    const direction: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
    ship.spawn(laneY, direction);

    this.nextLane++;
  }
}

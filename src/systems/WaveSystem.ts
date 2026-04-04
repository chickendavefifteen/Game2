import Phaser from 'phaser';
import { getWave, WaveConfig, SILO_POSITIONS } from '../config/LevelConfig';
import { Silo } from '../entities/Silo';
import { City } from '../entities/City';
import { Ship } from '../entities/Ship';
import { EventBus } from '../utils/EventBus';

export class WaveSystem {
  currentWave: number = 1;
  waveConfig: WaveConfig;

  private scene: Phaser.Scene;
  private silos: Silo[];
  private cities: City[];
  private ships: Ship[];
  private timerMultiplier: number;

  private activeSiloCount: number = 0;
  private silosRemainingToActivate: number[] = [];
  private nextActivationTimer: number = 0;
  private readonly ACTIVATION_INTERVAL_MS = 3000;

  private waveComplete: boolean = false;

  constructor(scene: Phaser.Scene, silos: Silo[], cities: City[], ships: Ship[], timerMultiplier = 1.0) {
    this.scene = scene;
    this.silos = silos;
    this.cities = cities;
    this.ships = ships;
    this.timerMultiplier = timerMultiplier;
    this.waveConfig = getWave(1);

    EventBus.on('siloDestroyed', () => {
      this.activeSiloCount--;
      this.checkWaveComplete();
    });
  }

  startWave(waveNumber: number): void {
    this.currentWave = waveNumber;
    this.waveConfig = getWave(waveNumber);
    this.waveComplete = false;
    this.activeSiloCount = 0;
    this.nextActivationTimer = 0;

    // Queue the silo indices for this wave
    this.silosRemainingToActivate = [...this.waveConfig.siloPositionIndices];
    Phaser.Utils.Array.Shuffle(this.silosRemainingToActivate);

    // Reset silos
    this.silos.forEach((silo, idx) => {
      if (this.waveConfig.siloPositionIndices.includes(idx)) {
        silo.resetToIdle();
      } else {
        silo.state = 'idle';
        silo.setVisible(false);
      }
    });
  }

  update(delta: number): void {
    if (this.waveComplete) return;

    this.nextActivationTimer -= delta;

    if (
      this.nextActivationTimer <= 0 &&
      this.activeSiloCount < this.waveConfig.simultaneousActivations &&
      this.silosRemainingToActivate.length > 0
    ) {
      this.activateNextSilo();
      this.nextActivationTimer = this.ACTIVATION_INTERVAL_MS;
    }
  }

  private activateNextSilo(): void {
    const idx = this.silosRemainingToActivate.shift();
    if (idx === undefined) return;

    const silo = this.silos[idx];
    if (!silo || silo.state === 'destroyed') {
      this.activateNextSilo(); // skip destroyed silos
      return;
    }

    const timer = Phaser.Math.Between(
      Math.round(this.waveConfig.siloTimerMin * this.timerMultiplier) * 1000,
      Math.round(this.waveConfig.siloTimerMax * this.timerMultiplier) * 1000
    ) / 1000;

    // Pick a target: random ship or random city
    const target = this.pickTarget();
    silo.activate(timer, target.type, target.id, target.x, target.y);
    this.activeSiloCount++;
  }

  private pickTarget(): { type: 'ship' | 'city'; id: number; x: number; y: number } {
    // Prefer active ships when they're in the strait
    const activeShips = this.ships.filter(s => s.active && !s.isSunk);
    if (activeShips.length > 0 && Math.random() < 0.5) {
      const ship = activeShips[Math.floor(Math.random() * activeShips.length)];
      return { type: 'ship', id: ship.shipId, x: ship.x, y: ship.y };
    }

    // Otherwise target a city
    const activeCities = this.cities.filter(c => !c.isDestroyed);
    if (activeCities.length > 0) {
      const city = activeCities[Math.floor(Math.random() * activeCities.length)];
      return { type: 'city', id: city.cityId, x: city.x, y: city.y };
    }

    // Fallback: target center of strait
    return { type: 'city', id: 0, x: 240, y: 200 };
  }

  private checkWaveComplete(): void {
    const allDestroyed = this.silos
      .filter((_, idx) => this.waveConfig.siloPositionIndices.includes(idx))
      .every(s => s.state === 'destroyed');

    if (allDestroyed && this.silosRemainingToActivate.length === 0) {
      this.waveComplete = true;
      EventBus.emit('waveComplete', { waveNumber: this.currentWave });
    }
  }

  isWaveComplete(): boolean {
    return this.waveComplete;
  }
}

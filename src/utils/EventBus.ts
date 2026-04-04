import Phaser from 'phaser';

export type GameEvents = {
  'siloDestroyed': { siloId: number; x: number; y: number };
  'siloLaunched': { siloId: number; targetX: number; targetY: number };
  'siloWarning': { siloId: number; timeRemaining: number };
  'shipSafe': { shipId: number; cargoBarrels: number };
  'shipSunk': { shipId: number; cargoBarrels: number; x: number; y: number };
  'cityHit': { cityId: number; oilStorageValue: number; hp: number };
  'cityDestroyed': { cityId: number };
  'reservesDepleted': {};
  'waveComplete': { waveNumber: number };
  'gameOver': { score: number; oilTransported: number; oilLost: number; gulfReserves: number };
  'scoreChanged': { score: number };
  'livesChanged': { lives: number };
  'oilChanged': { transported: number; lost: number; reserves: number };
  'showAlert': { message: string; color?: number };
  'bombDropped': {};
  'missileFireed': {};
  'shotFired': {};
};

class TypedEventBus extends Phaser.Events.EventEmitter {
  emit<K extends keyof GameEvents>(event: K, data: GameEvents[K]): boolean {
    return super.emit(event as string, data);
  }

  on<K extends keyof GameEvents>(event: K, fn: (data: GameEvents[K]) => void, context?: unknown): this {
    return super.on(event as string, fn, context);
  }

  once<K extends keyof GameEvents>(event: K, fn: (data: GameEvents[K]) => void, context?: unknown): this {
    return super.once(event as string, fn, context);
  }

  off<K extends keyof GameEvents>(event: K, fn?: (data: GameEvents[K]) => void, context?: unknown): this {
    return super.off(event as string, fn, context);
  }
}

export const EventBus = new TypedEventBus();

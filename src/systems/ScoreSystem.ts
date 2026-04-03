import { BALANCE } from '../config/BalanceConfig';
import { EventBus } from '../utils/EventBus';

export class ScoreSystem {
  score: number = 0;
  lives: number = BALANCE.lives;
  oilTransported: number = 0;
  oilLost: number = 0;
  gulfReserves: number = BALANCE.oil.startingReserves;
  silosDestroyed: number = 0;
  shipsProtected: number = 0;
  shipsSunk: number = 0;

  constructor() {
    EventBus.on('siloDestroyed', () => {
      this.addScore(BALANCE.silo.scoreOnDestroy);
      this.silosDestroyed++;
    });

    EventBus.on('shipSafe', ({ cargoBarrels }) => {
      this.oilTransported += cargoBarrels;
      const bonus = Math.round(cargoBarrels * BALANCE.scoring.oilDeliveryBonus);
      this.addScore(BALANCE.ships.scorePerSafePassage + bonus);
      this.shipsProtected++;
      this.emitOil();
    });

    EventBus.on('shipSunk', ({ cargoBarrels }) => {
      this.oilLost += cargoBarrels;
      this.shipsSunk++;
      this.emitOil();
    });

    EventBus.on('cityHit', ({ oilStorageValue }) => {
      this.gulfReserves = Math.max(0, this.gulfReserves - oilStorageValue);
      this.score = Math.max(0, this.score - BALANCE.cities.scorePenaltyPerHit);
      this.emitOil();
      EventBus.emit('scoreChanged', { score: this.score });

      if (this.gulfReserves <= 0) {
        EventBus.emit('reservesDepleted', {});
      }
    });
  }

  private addScore(amount: number): void {
    this.score += amount;
    EventBus.emit('scoreChanged', { score: this.score });
  }

  private emitOil(): void {
    EventBus.emit('oilChanged', {
      transported: this.oilTransported,
      lost: this.oilLost,
      reserves: this.gulfReserves,
    });
  }

  loseLife(): void {
    this.lives = Math.max(0, this.lives - 1);
    EventBus.emit('livesChanged', { lives: this.lives });
  }

  isGameOver(): boolean {
    return this.lives <= 0 || this.gulfReserves <= 0;
  }

  reset(): void {
    this.score = 0;
    this.lives = BALANCE.lives;
    this.oilTransported = 0;
    this.oilLost = 0;
    this.gulfReserves = BALANCE.oil.startingReserves;
    this.silosDestroyed = 0;
    this.shipsProtected = 0;
    this.shipsSunk = 0;
    EventBus.emit('scoreChanged', { score: 0 });
    EventBus.emit('livesChanged', { lives: this.lives });
    EventBus.emit('oilChanged', {
      transported: 0,
      lost: 0,
      reserves: this.gulfReserves,
    });
  }

  getReport() {
    return {
      score: this.score,
      oilTransported: this.oilTransported,
      oilLost: this.oilLost,
      gulfReserves: this.gulfReserves,
      silosDestroyed: this.silosDestroyed,
      shipsProtected: this.shipsProtected,
      shipsSunk: this.shipsSunk,
    };
  }
}

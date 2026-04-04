import { BALANCE, DifficultyConfig, DIFFICULTIES } from '../config/BalanceConfig';
import { EventBus } from '../utils/EventBus';

export class ScoreSystem {
  score: number = 0;
  lives: number;
  oilTransported: number = 0;
  oilLost: number = 0;
  gulfReserves: number = BALANCE.oil.startingReserves;
  silosDestroyed: number = 0;
  shipsProtected: number = 0;
  shipsSunk: number = 0;

  // Accuracy tracking
  shotsFired: number = 0;   // bombs + missiles fired
  shotsHit: number = 0;     // bombs/missiles that hit a silo

  private difficulty: DifficultyConfig;

  constructor(difficulty: DifficultyConfig = DIFFICULTIES.sergeant) {
    this.difficulty = difficulty;
    this.lives = difficulty.startingBombs !== undefined ? BALANCE.lives : BALANCE.lives;

    EventBus.on('siloDestroyed', () => {
      this.addScore(BALANCE.silo.scoreOnDestroy);
      this.silosDestroyed++;
      this.shotsHit++;
    });

    EventBus.on('shotFired', () => {
      this.shotsFired++;
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
    this.score += Math.round(amount * this.difficulty.scoreMultiplier);
    EventBus.emit('scoreChanged', { score: this.score });
  }

  private emitOil(): void {
    EventBus.emit('oilChanged', {
      transported: this.oilTransported,
      lost: this.oilLost,
      reserves: this.gulfReserves,
    });
  }

  addWaveClearBonus(perfect: boolean): void {
    const bonus = perfect
      ? BALANCE.scoring.waveClearBonus + BALANCE.scoring.perfectWaveBonus
      : BALANCE.scoring.waveClearBonus;
    this.addScore(bonus);
  }

  loseLife(): void {
    this.lives = Math.max(0, this.lives - 1);
    EventBus.emit('livesChanged', { lives: this.lives });
  }

  isGameOver(): boolean {
    return this.lives <= 0 || this.gulfReserves <= 0;
  }

  getEfficiency(): number {
    if (this.shotsFired === 0) return 100;
    return Math.round((this.shotsHit / this.shotsFired) * 100);
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
    this.shotsFired = 0;
    this.shotsHit = 0;
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
      efficiency: this.getEfficiency(),
    };
  }
}

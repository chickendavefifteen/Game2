export const BALANCE = {
  aircraft: {
    speed: 100,
    startingBombs: 12,
    startingMissiles: 4,
    bombCooldownMs: 400,
    bombRange: 36,
    bombSpeed: 90,
    missileSpeed: 140,
  },

  silo: {
    hitPoints: 1,
    baseTimerSeconds: 22,
    timerReductionPerWave: 2,
    minTimerSeconds: 8,
    warningThresholdSeconds: 6,
    scoreOnDestroy: 100,
  },

  ships: {
    spawnIntervalSeconds: 14,
    speed: 32,
    hitPoints: 2,
    scorePerSafePassage: 500,
    cargoBarrelsMin: 1_000_000,
    cargoBarrelsMax: 3_000_000,
  },

  cities: {
    hitPoints: 3,
    oilStorageValue: 15_000_000,
    scorePenaltyPerHit: 200,
  },

  oil: {
    startingReserves: 50_000_000,
    missionSuccessMinDelivery: 5_000_000,
  },

  scoring: {
    siloDestroyed: 100,
    missileIntercepted: 150,
    bonusPerRemainingSecond: 10,
    oilDeliveryBonus: 0.05,
  },

  lives: 3,
};

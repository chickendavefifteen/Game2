export const BALANCE = {
  aircraft: {
    speed: 120,            // pixels/second
    startingBombs: 12,
    startingMissiles: 4,
    bombCooldownMs: 400,
    bombRange: 32,         // auto-drop when aircraft is this close to a locked silo
    bombSpeed: 90,         // pixels/second fall speed
    missileSpeed: 160,
  },

  silo: {
    hitPoints: 1,                // increases in later waves (see LevelConfig)
    baseTimerSeconds: 22,
    timerReductionPerWave: 2,    // each wave reduces timer by this
    minTimerSeconds: 8,
    warningThresholdSeconds: 6,
    scoreOnDestroy: 100,
  },

  ships: {
    spawnIntervalSeconds: 14,
    speed: 38,                   // pixels/second (west→east or reverse)
    hitPoints: 2,
    scorePerSafePassage: 500,
    cargoBarrelsMin: 1_000_000,  // 1M barrels
    cargoBarrelsMax: 3_000_000,  // 3M barrels (supertanker)
  },

  cities: {
    hitPoints: 3,
    oilStorageValue: 15_000_000,  // 15M barrels per city
    scorePenaltyPerHit: 200,
  },

  oil: {
    startingReserves: 50_000_000,    // 50M barrels total across all cities
    missionSuccessMinDelivery: 5_000_000, // must deliver at least 5M to "win"
  },

  scoring: {
    siloDestroyed: 100,
    missileIntercepted: 150,
    bonusPerRemainingSecond: 10,
    oilDeliveryBonus: 0.05,   // extra score = barrels * this
  },

  lives: 3,
};

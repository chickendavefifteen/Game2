export type Difficulty = 'recruit' | 'sergeant' | 'commander' | 'admiral';

export interface DifficultyConfig {
  label: string;
  color: string;
  scoreMultiplier: number;
  timerMultiplier: number;   // >1 = longer timers (easier), <1 = shorter (harder)
  startingBombs: number;
  startingMissiles: number;
  bombRefillPerWave: number;
  missileRefillPerWave: number;
  siloHpMultiplier: number;  // applied to wave silo HP
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  recruit: {
    label: 'RECRUIT',   color: '#44ff88', scoreMultiplier: 0.7,
    timerMultiplier: 1.55, startingBombs: 18, startingMissiles: 7,
    bombRefillPerWave: 10, missileRefillPerWave: 4, siloHpMultiplier: 0.5,
  },
  sergeant: {
    label: 'SERGEANT',  color: '#ffee44', scoreMultiplier: 1.0,
    timerMultiplier: 1.0,  startingBombs: 12, startingMissiles: 4,
    bombRefillPerWave: 6,  missileRefillPerWave: 2, siloHpMultiplier: 1.0,
  },
  commander: {
    label: 'COMMANDER', color: '#ff8833', scoreMultiplier: 1.6,
    timerMultiplier: 0.72, startingBombs: 10, startingMissiles: 3,
    bombRefillPerWave: 4,  missileRefillPerWave: 1, siloHpMultiplier: 1.5,
  },
  admiral: {
    label: 'ADMIRAL',   color: '#ff2222', scoreMultiplier: 2.8,
    timerMultiplier: 0.50, startingBombs: 7,  startingMissiles: 2,
    bombRefillPerWave: 3,  missileRefillPerWave: 1, siloHpMultiplier: 2.0,
  },
};

// Rank titles awarded based on final score
export const RANK_TITLES: Array<{ minScore: number; title: string; color: string }> = [
  { minScore: 0,       title: 'Conscript',  color: '#888888' },
  { minScore: 500,     title: 'Private',    color: '#aabbaa' },
  { minScore: 2000,    title: 'Corporal',   color: '#88ccaa' },
  { minScore: 5000,    title: 'Sergeant',   color: '#ffee44' },
  { minScore: 12000,   title: 'Lieutenant', color: '#88ddff' },
  { minScore: 25000,   title: 'Captain',    color: '#55bbff' },
  { minScore: 50000,   title: 'Major',      color: '#ff8833' },
  { minScore: 100000,  title: 'Colonel',    color: '#ff5522' },
  { minScore: 200000,  title: 'Admiral',    color: '#ff2222' },
];

export function getRank(score: number): { title: string; color: string } {
  let rank = RANK_TITLES[0];
  for (const r of RANK_TITLES) {
    if (score >= r.minScore) rank = r;
  }
  return rank;
}

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
    waveClearBonus: 500,
    perfectWaveBonus: 1000,  // no ships sunk, no cities hit
  },

  lives: 3,
};

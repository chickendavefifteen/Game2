import { SILO_POSITIONS } from './GameConfig';

export interface WaveConfig {
  waveNumber: number;
  siloCount: number;
  siloTimerMin: number;   // seconds
  siloTimerMax: number;
  simultaneousActivations: number;
  siloPositionIndices: number[];  // indices into SILO_POSITIONS
  siloHitPoints: number;
  shipInterval: number;  // seconds between ships
  description: string;
}

export const WAVES: WaveConfig[] = [
  {
    waveNumber: 1,
    siloCount: 3,
    siloTimerMin: 22,
    siloTimerMax: 30,
    simultaneousActivations: 1,
    siloPositionIndices: [0, 3, 6],
    siloHitPoints: 1,
    shipInterval: 16,
    description: 'Initial threat detected',
  },
  {
    waveNumber: 2,
    siloCount: 5,
    siloTimerMin: 16,
    siloTimerMax: 24,
    simultaneousActivations: 2,
    siloPositionIndices: [0, 1, 3, 5, 7],
    siloHitPoints: 1,
    shipInterval: 13,
    description: 'Multiple launchers active',
  },
  {
    waveNumber: 3,
    siloCount: 6,
    siloTimerMin: 12,
    siloTimerMax: 20,
    simultaneousActivations: 2,
    siloPositionIndices: [0, 1, 2, 4, 5, 7],
    siloHitPoints: 2,
    shipInterval: 11,
    description: 'Hardened bunkers detected',
  },
  {
    waveNumber: 4,
    siloCount: 8,
    siloTimerMin: 9,
    siloTimerMax: 16,
    simultaneousActivations: 3,
    siloPositionIndices: [0, 1, 2, 3, 4, 5, 6, 7],
    siloHitPoints: 2,
    shipInterval: 10,
    description: 'Full missile battery activated',
  },
  {
    waveNumber: 5,
    siloCount: 8,
    siloTimerMin: 7,
    siloTimerMax: 13,
    simultaneousActivations: 4,
    siloPositionIndices: [0, 1, 2, 3, 4, 5, 6, 7],
    siloHitPoints: 3,
    shipInterval: 9,
    description: 'Maximum threat level',
  },
];

export function getWave(waveNumber: number): WaveConfig {
  if (waveNumber <= WAVES.length) {
    return WAVES[waveNumber - 1];
  }
  // Endless mode: extrapolate from last wave
  const last = WAVES[WAVES.length - 1];
  return {
    ...last,
    waveNumber,
    siloTimerMin: Math.max(5, last.siloTimerMin - (waveNumber - WAVES.length)),
    siloTimerMax: Math.max(8, last.siloTimerMax - (waveNumber - WAVES.length)),
    simultaneousActivations: Math.min(6, last.simultaneousActivations + 1),
    shipInterval: Math.max(7, last.shipInterval - 1),
    description: `Wave ${waveNumber} — Critical threat`,
  };
}

export { SILO_POSITIONS };

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
  // ── Tier 1: Recruit (waves 1-3) ──────────────────────────────────────────
  {
    waveNumber: 1, siloCount: 3, siloTimerMin: 22, siloTimerMax: 30,
    simultaneousActivations: 1, siloPositionIndices: [0, 3, 6],
    siloHitPoints: 1, shipInterval: 18, description: 'Initial threat detected',
  },
  {
    waveNumber: 2, siloCount: 4, siloTimerMin: 18, siloTimerMax: 26,
    simultaneousActivations: 1, siloPositionIndices: [0, 2, 5, 7],
    siloHitPoints: 1, shipInterval: 15, description: 'Second battery online',
  },
  {
    waveNumber: 3, siloCount: 5, siloTimerMin: 15, siloTimerMax: 22,
    simultaneousActivations: 2, siloPositionIndices: [0, 1, 3, 5, 7],
    siloHitPoints: 1, shipInterval: 13, description: 'Multiple launchers active',
  },
  // ── Tier 2: Sergeant (waves 4-6) ─────────────────────────────────────────
  {
    waveNumber: 4, siloCount: 6, siloTimerMin: 12, siloTimerMax: 18,
    simultaneousActivations: 2, siloPositionIndices: [0, 1, 2, 4, 5, 7],
    siloHitPoints: 2, shipInterval: 11, description: 'Hardened bunkers detected',
  },
  {
    waveNumber: 5, siloCount: 7, siloTimerMin: 10, siloTimerMax: 16,
    simultaneousActivations: 3, siloPositionIndices: [0, 1, 2, 3, 4, 5, 7],
    siloHitPoints: 2, shipInterval: 10, description: 'Reinforced positions',
  },
  {
    waveNumber: 6, siloCount: 8, siloTimerMin: 9, siloTimerMax: 14,
    simultaneousActivations: 3, siloPositionIndices: [0, 1, 2, 3, 4, 5, 6, 7],
    siloHitPoints: 2, shipInterval: 9, description: 'Full battery engaged',
  },
  // ── Tier 3: Commander (waves 7-9) ────────────────────────────────────────
  {
    waveNumber: 7, siloCount: 8, siloTimerMin: 8, siloTimerMax: 12,
    simultaneousActivations: 4, siloPositionIndices: [0, 1, 2, 3, 4, 5, 6, 7],
    siloHitPoints: 3, shipInterval: 8, description: 'Elite missile corps',
  },
  {
    waveNumber: 8, siloCount: 8, siloTimerMin: 7, siloTimerMax: 11,
    simultaneousActivations: 4, siloPositionIndices: [0, 1, 2, 3, 4, 5, 6, 7],
    siloHitPoints: 3, shipInterval: 7, description: 'Saturation barrage',
  },
  {
    waveNumber: 9, siloCount: 8, siloTimerMin: 6, siloTimerMax: 10,
    simultaneousActivations: 5, siloPositionIndices: [0, 1, 2, 3, 4, 5, 6, 7],
    siloHitPoints: 3, shipInterval: 7, description: 'Critical strike imminent',
  },
  // ── Tier 4: Admiral (wave 10) ────────────────────────────────────────────
  {
    waveNumber: 10, siloCount: 8, siloTimerMin: 5, siloTimerMax: 9,
    simultaneousActivations: 6, siloPositionIndices: [0, 1, 2, 3, 4, 5, 6, 7],
    siloHitPoints: 4, shipInterval: 6, description: 'ADMIRAL-LEVEL THREAT',
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

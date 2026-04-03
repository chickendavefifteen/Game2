// Portrait resolution — 270×480 (9:16)
export const GAME_WIDTH  = 270;
export const GAME_HEIGHT = 480;

export const TILE_SIZE = 16;

// ── Hormuz Strait coastline shape ───────────────────────────────────────────
// The strait runs west(left)→east(right). The Iranian coast (north) angles
// downward toward the east. The Musandam/Gulf-state coast (south) angles
// upward toward the east — creating the real narrowing funnel shape.
//
// northCoastY(x): y coordinate of the Iranian coastline at a given x
// southCoastY(x): y coordinate of the southern coastline at a given x
//
export function northCoastY(x: number): number {
  const t = x / GAME_WIDTH;
  // Starts at 155 on the left (wide Persian Gulf opening)
  // Drops to 120 on the right (Iran headlands narrowing the strait)
  // Slight concave bay shape in the middle
  return Math.round(155 - 35 * t - 18 * Math.sin(Math.PI * t));
}

export function southCoastY(x: number): number {
  const t = x / GAME_WIDTH;
  // Starts at 340 on the left, rises to 310 on the right
  // Musandam peninsula creates a bump at ~75% across
  return Math.round(340 - 30 * t + 22 * Math.sin(Math.PI * (t - 0.1)) * Math.max(0, t - 0.4));
}

// Water zone for aircraft patrol (inside the strait)
export const WATER_Y_MIN = 160;
export const WATER_Y_MAX = 310;

// Ship lanes — horizontal tracks inside the strait
export const SHIP_LANE_Y = [210, 250, 285];

// Silo positions along the Iranian (north) coast
// Spaced across the width, sitting just above northCoastY
export const SILO_POSITIONS: { x: number; y: number }[] = [
  { x: 28,  y: 108 },
  { x: 68,  y: 96  },
  { x: 108, y: 88  },
  { x: 148, y: 80  },
  { x: 188, y: 75  },
  { x: 218, y: 70  },
  { x: 245, y: 68  },
  { x: 258, y: 80  },
];

// City positions along the southern (Gulf state) coast
export const CITY_POSITIONS: { x: number; y: number; name: string }[] = [
  { x: 45,  y: 372, name: 'Abu Dhabi' },
  { x: 135, y: 362, name: 'Dubai'     },
  { x: 225, y: 348, name: 'Muscat'    },
];

// Aircraft starting position (center of the strait)
export const AIRCRAFT_START = { x: GAME_WIDTH / 2, y: 245 };

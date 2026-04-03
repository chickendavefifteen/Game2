// Logical game resolution — all game coordinates are in these units.
// Phaser scales this up to fill the device screen with integer/near-integer scaling.
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;

// Tile size in logical pixels
export const TILE_SIZE = 16;

// Map dimensions in tiles
export const MAP_COLS = 30;  // 480 / 16
export const MAP_ROWS = 17;  // 270 / 16 (roughly)

// Coastline tile rows (inclusive)
export const NORTH_COAST_ROWS = { start: 0, end: 3 };   // Iran / silos
export const WATER_ROWS       = { start: 4, end: 12 };  // Strait
export const SOUTH_COAST_ROWS = { start: 13, end: 16 }; // Gulf states / cities

// Ship lane Y positions (world pixels)
export const SHIP_LANE_Y = [
  TILE_SIZE * 6 + TILE_SIZE / 2,   // ~104
  TILE_SIZE * 10 + TILE_SIZE / 2,  // ~168
];

// City world positions (center X, Y)
export const CITY_POSITIONS: { x: number; y: number; name: string }[] = [
  { x: 80,  y: TILE_SIZE * 15, name: 'Abu Dhabi' },
  { x: 240, y: TILE_SIZE * 15, name: 'Dubai' },
  { x: 400, y: TILE_SIZE * 15, name: 'Muscat' },
];

// Silo positions along north coast
export const SILO_POSITIONS: { x: number; y: number }[] = [
  { x: 40,  y: TILE_SIZE * 2 },
  { x: 90,  y: TILE_SIZE * 1 },
  { x: 140, y: TILE_SIZE * 2 },
  { x: 190, y: TILE_SIZE * 1 },
  { x: 240, y: TILE_SIZE * 2 },
  { x: 300, y: TILE_SIZE * 2 },
  { x: 360, y: TILE_SIZE * 1 },
  { x: 420, y: TILE_SIZE * 2 },
];

// Aircraft starting position
export const AIRCRAFT_START = { x: GAME_WIDTH / 2, y: TILE_SIZE * 8 };

/**
 * Snaps a value to the nearest integer pixel coordinate.
 * Critical for crisp pixel art — prevents sub-pixel rendering blurriness.
 */
export function snapToPixel(value: number): number {
  return Math.round(value);
}

export function snapVec(x: number, y: number): { x: number; y: number } {
  return { x: Math.round(x), y: Math.round(y) };
}

/**
 * Clamps a game object's position to integer coordinates.
 */
export function clampToPixel(obj: { x: number; y: number }): void {
  obj.x = Math.round(obj.x);
  obj.y = Math.round(obj.y);
}

/**
 * Linearly interpolate and snap to pixel grid.
 */
export function lerpPixel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

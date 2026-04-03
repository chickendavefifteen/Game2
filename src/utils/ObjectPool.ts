export class ObjectPool<T extends { active: boolean }> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize = 10) {
    this.factory = factory;
    this.reset = reset;
    for (let i = 0; i < initialSize; i++) {
      const obj = factory();
      obj.active = false;
      this.pool.push(obj);
    }
  }

  get(): T {
    const existing = this.pool.find(o => !o.active);
    if (existing) {
      existing.active = true;
      this.reset(existing);
      return existing;
    }
    const fresh = this.factory();
    fresh.active = true;
    this.reset(fresh);
    this.pool.push(fresh);
    return fresh;
  }

  release(obj: T): void {
    obj.active = false;
  }

  getActive(): T[] {
    return this.pool.filter(o => o.active);
  }

  releaseAll(): void {
    this.pool.forEach(o => { o.active = false; });
  }

  get size(): number {
    return this.pool.length;
  }
}

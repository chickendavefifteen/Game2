import Phaser from 'phaser';
import { Bomb } from '../entities/Bomb';
import { AircraftMissile } from '../entities/AircraftMissile';
import { EnemyMissile } from '../entities/EnemyMissile';
import { Silo } from '../entities/Silo';
import { Ship } from '../entities/Ship';
import { City } from '../entities/City';
import { Explosion } from '../entities/Explosion';
import { OilSlick } from '../ui/OilSlick';
import { EventBus } from '../utils/EventBus';
import { ObjectPool } from '../utils/ObjectPool';

export class CollisionSystem {
  private scene: Phaser.Scene;
  private bombs: Bomb[];
  private playerMissiles: AircraftMissile[];
  private enemyMissiles: EnemyMissile[];
  private silos: Silo[];
  private ships: Ship[];
  private cities: City[];
  private explosionPool: ObjectPool<Explosion>;
  private oilSlickPool: ObjectPool<OilSlick>;

  constructor(
    scene: Phaser.Scene,
    bombs: Bomb[],
    playerMissiles: AircraftMissile[],
    enemyMissiles: EnemyMissile[],
    silos: Silo[],
    ships: Ship[],
    cities: City[],
    explosionPool: ObjectPool<Explosion>,
    oilSlickPool: ObjectPool<OilSlick>
  ) {
    this.scene = scene;
    this.bombs = bombs;
    this.playerMissiles = playerMissiles;
    this.enemyMissiles = enemyMissiles;
    this.silos = silos;
    this.ships = ships;
    this.cities = cities;
    this.explosionPool = explosionPool;
    this.oilSlickPool = oilSlickPool;
  }

  update(): void {
    // Bombs vs silos
    for (const bomb of this.bombs) {
      if (!bomb.active) continue;
      for (const silo of this.silos) {
        if (silo.state === 'destroyed') continue;
        const dist = Phaser.Math.Distance.Between(bomb.x, bomb.y, silo.x, silo.y);
        if (dist < 12) {
          bomb.active = false;
          bomb.setVisible(false);
          this.spawnExplosion(bomb.x, bomb.y);
          silo.hit();
          break;
        }
      }
    }

    // Player missiles vs silos
    for (const missile of this.playerMissiles) {
      if (!missile.active) continue;
      for (const silo of this.silos) {
        if (silo.state === 'destroyed') continue;
        const dist = Phaser.Math.Distance.Between(missile.x, missile.y, silo.x, silo.y);
        if (dist < 12) {
          missile.active = false;
          missile.setVisible(false);
          this.spawnExplosion(missile.x, missile.y);
          silo.hit();
          EventBus.emit('scoreChanged', { score: 0 }); // trigger intercept score in WaveSystem
          break;
        }
      }
    }

    // Enemy missiles vs ships (proximity check)
    for (const em of this.enemyMissiles) {
      if (!em.active) continue;
      for (const ship of this.ships) {
        if (!ship.active || ship.isSunk) continue;
        const dist = Phaser.Math.Distance.Between(em.x, em.y, ship.x, ship.y);
        if (dist < 16) {
          em.active = false;
          em.setVisible(false);
          this.spawnExplosion(em.x, em.y);
          ship.takeDamage();
          if (ship.isSunk) {
            this.spawnOilSlick(ship.x, ship.y);
          }
          break;
        }
      }
    }

    // Enemy missiles vs cities
    for (const em of this.enemyMissiles) {
      if (!em.active) continue;
      for (const city of this.cities) {
        if (city.isDestroyed) continue;
        const dist = Phaser.Math.Distance.Between(em.x, em.y, city.x, city.y);
        if (dist < 14) {
          em.active = false;
          em.setVisible(false);
          this.spawnExplosion(em.x, em.y);
          city.takeDamage();
          EventBus.emit('showAlert', {
            message: `⚠ ${city.cityName.toUpperCase()} UNDER ATTACK!`,
            color: 0xcc0000,
          });
          break;
        }
      }
    }

    // Player bombs vs enemy missiles (intercept bonus)
    for (const bomb of this.bombs) {
      if (!bomb.active) continue;
      for (const em of this.enemyMissiles) {
        if (!em.active) continue;
        const dist = Phaser.Math.Distance.Between(bomb.x, bomb.y, em.x, em.y);
        if (dist < 10) {
          bomb.active = false;
          bomb.setVisible(false);
          em.active = false;
          em.setVisible(false);
          this.spawnExplosion(bomb.x, bomb.y);
          EventBus.emit('showAlert', { message: 'MISSILE INTERCEPTED! +150', color: 0x228822 });
          break;
        }
      }
    }
  }

  private spawnExplosion(x: number, y: number): void {
    const exp = this.explosionPool.get();
    exp.playAt(x, y, () => this.explosionPool.release(exp));
    // Camera shake
    this.scene.cameras.main.shake(120, 0.008);
  }

  private spawnOilSlick(x: number, y: number): void {
    const slick = this.oilSlickPool.get();
    slick.spawn(x, y);
  }
}

import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, TILE_SIZE,
  CITY_POSITIONS, SILO_POSITIONS, AIRCRAFT_START,
  northCoastY, southCoastY,
  WATER_Y_MIN, WATER_Y_MAX,
} from '../config/GameConfig';
import { BALANCE } from '../config/BalanceConfig';
import { Aircraft }        from '../entities/Aircraft';
import { Bomb }            from '../entities/Bomb';
import { AircraftMissile } from '../entities/AircraftMissile';
import { EnemyMissile }    from '../entities/EnemyMissile';
import { Silo }            from '../entities/Silo';
import { Ship }            from '../entities/Ship';
import { City }            from '../entities/City';
import { Explosion }       from '../entities/Explosion';
import { WaveSystem }      from '../systems/WaveSystem';
import { ShipSpawnSystem } from '../systems/ShipSpawnSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { InputSystem }     from '../systems/InputSystem';
import { ScoreSystem }     from '../systems/ScoreSystem';
import { AlertBanner }     from '../ui/AlertBanner';
import { OilSlick }        from '../ui/OilSlick';
import { ObjectPool }      from '../utils/ObjectPool';
import { EventBus }        from '../utils/EventBus';
import { getWave }         from '../config/LevelConfig';

const MAX_BOMBS   = 16;
const MAX_MISSILES = 8;
const MAX_SHIPS    = 5;
const MAX_EXPLOSIONS = 10;
const MAX_ENEMY_MISSILES = 12;
const MAX_OIL_SLICKS = 6;

export class GameScene extends Phaser.Scene {
  private aircraft!: Aircraft;
  private bombs: Bomb[] = [];
  private playerMissiles: AircraftMissile[] = [];
  private enemyMissiles: EnemyMissile[] = [];
  private silos: Silo[] = [];
  private ships: Ship[] = [];
  private cities: City[] = [];

  private explosionPool!: ObjectPool<Explosion>;
  private oilSlickPool!:  ObjectPool<OilSlick>;
  private oilSlicks: OilSlick[] = [];

  private waveSystem!:   WaveSystem;
  private shipSpawn!:    ShipSpawnSystem;
  private collisions!:   CollisionSystem;
  private inputSystem!:  InputSystem;
  private scoreSystem!:  ScoreSystem;

  private alertBanner!: AlertBanner;
  private spaceKey!:    Phaser.Input.Keyboard.Key;
  private waveNumber   = 1;
  private gameActive   = false;
  private waveTransitionTimer = 0;
  private inWaveTransition    = false;

  constructor() { super({ key: 'GameScene' }); }

  create(): void {
    this.gameActive = true;
    this.waveNumber = 1;

    this.buildBackground();
    this.createEntities();
    this.createSystems();
    this.createHUD();
    this.bindEvents();

    this.scene.launch('HUDScene');
    this.waveSystem.startWave(1);
    this.shipSpawn.start();

    if (this.input.keyboard) {
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }
  }

  // ── Background: actual Hormuz strait silhouette ──────────────────────────

  private buildBackground(): void {
    const gfx = this.add.graphics().setDepth(0);

    // ── Full-screen water base ──
    gfx.fillStyle(0x1a3058);
    gfx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // ── Water shimmer rows ──
    for (let y = 0; y < GAME_HEIGHT; y += 8) {
      if (Math.floor(y / 8) % 3 === 0) {
        gfx.fillStyle(0x1e3870, 0.5);
        gfx.fillRect(0, y, GAME_WIDTH, 4);
      }
    }

    // ── North land (Iran) — fill from top down to the coast line ──
    gfx.fillStyle(0x8B7355);
    for (let x = 0; x < GAME_WIDTH; x++) {
      const ny = northCoastY(x);
      gfx.fillRect(x, 0, 1, ny);
    }

    // ── South land (Gulf states / Musandam) — fill from coast down ──
    gfx.fillStyle(0xc4a472);
    for (let x = 0; x < GAME_WIDTH; x++) {
      const sy = southCoastY(x);
      gfx.fillRect(x, sy, 1, GAME_HEIGHT - sy);
    }

    // ── North coast edge detail (rocky cliff line) ──
    gfx.fillStyle(0x6a5a3a);
    for (let x = 0; x < GAME_WIDTH; x++) {
      const ny = northCoastY(x);
      gfx.fillRect(x, ny, 1, 3);
    }
    // Shallow water fringe below coast
    gfx.fillStyle(0x1e4a88, 0.4);
    for (let x = 0; x < GAME_WIDTH; x++) {
      const ny = northCoastY(x);
      gfx.fillRect(x, ny + 3, 1, 10);
    }

    // ── South coast edge detail ──
    gfx.fillStyle(0xa08040);
    for (let x = 0; x < GAME_WIDTH; x++) {
      const sy = southCoastY(x);
      gfx.fillRect(x, sy - 3, 1, 3);
    }
    gfx.fillStyle(0x1e4a88, 0.3);
    for (let x = 0; x < GAME_WIDTH; x++) {
      const sy = southCoastY(x);
      gfx.fillRect(x, sy - 12, 1, 10);
    }

    // ── Rock formations on north coast ──
    gfx.fillStyle(0x706050);
    [30, 75, 120, 170, 220, 250].forEach(x => {
      const ny = northCoastY(x);
      const w = 8 + (x % 10);
      gfx.fillRect(x - w/2, ny - 6, w, 8);
      gfx.fillStyle(0x807060);
      gfx.fillRect(x - w/2 + 1, ny - 8, w - 2, 4);
      gfx.fillStyle(0x706050);
    });

    // ── Hormuz Island (small island in the strait, eastern side) ──
    const islandX = 230, islandY = 200;
    gfx.fillStyle(0x9B8365);
    gfx.fillEllipse(islandX, islandY, 18, 10);
    gfx.fillStyle(0x8B7355);
    gfx.fillEllipse(islandX, islandY, 14, 7);
    gfx.fillStyle(0x6a9a55);
    gfx.fillRect(islandX - 2, islandY - 2, 4, 3);

    // ── Qeshm Island (larger, north-west area) ──
    gfx.fillStyle(0x9B8365);
    gfx.fillEllipse(80, 175, 28, 12);
    gfx.fillStyle(0x8B7355);
    gfx.fillEllipse(80, 175, 22, 9);

    // ── Ship lane markers (faint dotted lines) ──
    gfx.fillStyle(0x2244aa, 0.15);
    for (const laneY of [210, 250, 285]) {
      gfx.fillRect(0, laneY, GAME_WIDTH, 2);
    }

    // ── Labels ──
    this.add.text(8, 12, 'IRAN', {
      fontSize: '6px', color: '#ccbbaa88', fontFamily: 'monospace'
    }).setDepth(5).setAlpha(0.6);

    this.add.text(8, GAME_HEIGHT - 22, 'GULF STATES', {
      fontSize: '5px', color: '#ccbbaa88', fontFamily: 'monospace'
    }).setDepth(5).setAlpha(0.6);

    this.add.text(GAME_WIDTH / 2, 230, 'STRAIT OF HORMUZ', {
      fontSize: '5px', color: '#ffffff22', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(2).setAlpha(0.25);
  }

  // ── Entity creation ──────────────────────────────────────────────────────

  private createEntities(): void {
    for (let i = 0; i < SILO_POSITIONS.length; i++) {
      const p = SILO_POSITIONS[i];
      this.silos.push(new Silo(this, p.x, p.y, i, 1));
    }
    for (let i = 0; i < CITY_POSITIONS.length; i++) {
      const p = CITY_POSITIONS[i];
      this.cities.push(new City(this, p.x, p.y, i, p.name));
    }

    this.aircraft = new Aircraft(this, AIRCRAFT_START.x, AIRCRAFT_START.y);

    this.explosionPool = new ObjectPool<Explosion>(
      () => new Explosion(this),
      e  => { e.setVisible(false); },
      MAX_EXPLOSIONS
    );

    const oilSlickInstances: OilSlick[] = [];
    this.oilSlickPool = new ObjectPool<OilSlick>(
      () => { const o = new OilSlick(this); oilSlickInstances.push(o); return o; },
      _o => {},
      MAX_OIL_SLICKS
    );
    this.oilSlicks = oilSlickInstances;

    for (let i = 0; i < MAX_BOMBS;          i++) this.bombs.push(new Bomb(this));
    for (let i = 0; i < MAX_MISSILES;       i++) this.playerMissiles.push(new AircraftMissile(this));
    for (let i = 0; i < MAX_ENEMY_MISSILES; i++) this.enemyMissiles.push(new EnemyMissile(this));
    for (let i = 0; i < MAX_SHIPS;          i++) this.ships.push(new Ship(this, i));
  }

  private createSystems(): void {
    this.scoreSystem = new ScoreSystem();
    this.waveSystem  = new WaveSystem(this, this.silos, this.cities, this.ships);
    this.shipSpawn   = new ShipSpawnSystem(this, this.ships, BALANCE.ships.spawnIntervalSeconds);

    this.collisions = new CollisionSystem(
      this, this.bombs, this.playerMissiles, this.enemyMissiles,
      this.silos, this.ships, this.cities,
      this.explosionPool, this.oilSlickPool
    );

    this.inputSystem = new InputSystem(this, this.aircraft, this.silos, {
      onDropBomb:       (tx, ty) => this.handleDropBomb(tx, ty),
      onFireMissile:    idx      => this.handleFireMissile(idx),
      onTapBombButton:  ()       => this.handleBombButton(),
      onTapMissileButton: ()     => this.handleMissileButton(),
    });
  }

  private createHUD(): void {
    this.alertBanner = new AlertBanner(this);

    // ── BOMB button — bottom left ──
    const bombBtn = this.add.rectangle(34, GAME_HEIGHT - 28, 58, 22, 0x334455, 0.88)
      .setDepth(60).setScrollFactor(0).setStrokeStyle(1, 0x88aacc, 0.8).setInteractive();
    this.add.text(34, GAME_HEIGHT - 28, '💣 BOMB', {
      fontSize: '6px', color: '#aaccff', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(61).setScrollFactor(0);
    bombBtn.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      ptr.event.stopPropagation(); this.handleBombButton();
    });

    // ── MISSILE button — bottom right ──
    const missileBtn = this.add.rectangle(GAME_WIDTH - 38, GAME_HEIGHT - 28, 64, 22, 0x443355, 0.88)
      .setDepth(60).setScrollFactor(0).setStrokeStyle(1, 0xaa88cc, 0.8).setInteractive();
    this.add.text(GAME_WIDTH - 38, GAME_HEIGHT - 28, '🚀 MISSILE', {
      fontSize: '6px', color: '#ddaaff', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(61).setScrollFactor(0);
    missileBtn.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      ptr.event.stopPropagation(); this.handleMissileButton();
    });
  }

  private bindEvents(): void {
    EventBus.on('siloLaunched', ({ siloId, targetX, targetY }) => {
      this.spawnEnemyMissile(siloId, targetX, targetY);
    }, this);

    EventBus.on('cityHit', ({ cityId }) => {
      const city = this.cities[cityId];
      if (city) {
        this.alertBanner.show(`⚠ ${city.cityName.toUpperCase()} HIT!`, 0xcc0000);
        this.cameras.main.shake(200, 0.012);
      }
    }, this);

    EventBus.on('cityDestroyed', ({ cityId }) => {
      const city = this.cities[cityId];
      if (city) {
        this.alertBanner.show(`💥 ${city.cityName.toUpperCase()} DESTROYED!`, 0x880000, 3000);
        this.scoreSystem.loseLife();
        this.cameras.main.shake(300, 0.02);
      }
      if (this.scoreSystem.isGameOver()) this.endGame(false);
    }, this);

    EventBus.on('shipSunk', () => {
      this.alertBanner.show('🚢 TANKER SUNK — OIL SPILL!', 0x884400);
      this.cameras.main.shake(150, 0.008);
    }, this);

    EventBus.on('reservesDepleted', () => { this.endGame(false); }, this);

    EventBus.on('waveComplete', ({ waveNumber }) => {
      this.alertBanner.show(`✓ WAVE ${waveNumber} CLEAR`, 0x225522, 2500);
      this.inWaveTransition = true;
      this.waveTransitionTimer = 3000;
      this.shipSpawn.stop();
    }, this);

    EventBus.on('showAlert', ({ message, color }) => {
      this.alertBanner.show(message, color ?? 0xcc0000);
    }, this);
  }

  // ── Weapon handlers ──────────────────────────────────────────────────────

  private handleDropBomb(targetX?: number, targetY?: number): void {
    if (!this.gameActive) return;
    const tx = targetX ?? this.aircraft.x;
    const ty = targetY ?? this.aircraft.y - 30;
    const bomb = this.bombs.find(b => !b.active);
    if (!bomb) return;
    if (!this.aircraft.dropBomb(tx, ty)) return;
    bomb.launch(this.aircraft.x, this.aircraft.y, tx, ty, () => {});
  }

  private handleBombButton(): void {
    const lockedIdx = this.silos.findIndex(s => s.siloId === this.aircraft.getLockedSiloId());
    if (lockedIdx !== -1) {
      const silo = this.silos[lockedIdx];
      this.handleDropBomb(silo.x, silo.y);
    } else {
      this.handleDropBomb(this.aircraft.x, this.aircraft.y - TILE_SIZE * 3);
    }
  }

  private handleFireMissile(siloIndex: number): void {
    if (!this.gameActive) return;
    if (!this.aircraft.fireMissile()) return;
    const silo = this.silos[siloIndex];
    if (!silo || silo.state === 'destroyed') return;
    const pm = this.playerMissiles.find(m => !m.active);
    if (!pm) return;
    pm.launch(this.aircraft.x, this.aircraft.y, silo.x, silo.y, () => {});
  }

  private handleMissileButton(): void {
    this.inputSystem.enterMissileSelectMode();
  }

  private spawnEnemyMissile(siloId: number, targetX: number, targetY: number): void {
    const silo = this.silos.find(s => s.siloId === siloId);
    if (!silo) return;
    const em = this.enemyMissiles.find(m => !m.active);
    if (!em) return;
    const ship = this.ships.find(s =>
      s.active && !s.isSunk && Math.abs(s.x - targetX) < 20 && Math.abs(s.y - targetY) < 20);
    const city = this.cities.find(c =>
      !c.isDestroyed && Math.abs(c.x - targetX) < 20 && Math.abs(c.y - targetY) < 20);
    em.launch(silo.x, silo.y, targetX, targetY,
      ship ? 'ship' : 'city',
      ship ? ship.shipId : (city ? city.cityId : 0));
    this.alertBanner.show('⚠ MISSILE LAUNCHED!', 0xcc4400, 1500);
  }

  // ── Main update loop ─────────────────────────────────────────────────────

  update(_time: number, delta: number): void {
    if (!this.gameActive) return;

    if (this.inWaveTransition) {
      this.waveTransitionTimer -= delta;
      if (this.waveTransitionTimer <= 0) {
        this.inWaveTransition = false;
        this.waveNumber++;
        this.aircraft.bombs   = Math.min(this.aircraft.bombs   + 6, BALANCE.aircraft.startingBombs);
        this.aircraft.missiles = Math.min(this.aircraft.missiles + 2, BALANCE.aircraft.startingMissiles);
        const newWave = getWave(this.waveNumber);
        this.silos.forEach(s => { s.maxHp = newWave.siloHitPoints; });
        this.waveSystem.startWave(this.waveNumber);
        this.shipSpawn.setInterval(newWave.shipInterval);
        this.shipSpawn.start();
        this.alertBanner.show(`WAVE ${this.waveNumber} — ${newWave.description}`, 0x113388, 2500);
      }
    }

    this.inputSystem.update(delta);
    this.aircraft.update(delta);

    // Auto-bomb locked silo when in range
    const lockedSiloId = this.aircraft.getLockedSiloId();
    if (lockedSiloId !== -1) {
      const silo = this.silos.find(s => s.siloId === lockedSiloId);
      if (silo && silo.state !== 'destroyed' && this.aircraft.isAtBombRange(silo.x, silo.y)) {
        this.handleDropBomb(silo.x, silo.y);
      }
    }

    if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.handleBombButton();

    this.waveSystem.update(delta);
    for (const silo of this.silos)          silo.update(delta);
    for (const em   of this.enemyMissiles)  em.update(delta);
    for (const bomb of this.bombs)          bomb.update(delta);
    for (const pm   of this.playerMissiles) pm.update(delta);

    this.collisions.update();
    this.shipSpawn.update(delta);
    for (const ship  of this.ships)     ship.update(delta);
    for (const slick of this.oilSlicks) slick.update(delta);

    if (this.scoreSystem.isGameOver()) this.endGame(false);
  }

  private endGame(victory: boolean): void {
    if (!this.gameActive) return;
    this.gameActive = false;
    this.shipSpawn.stop();
    const report = { ...this.scoreSystem.getReport(), wave: this.waveNumber, victory };
    EventBus.emit('gameOver', {
      score: report.score, oilTransported: report.oilTransported,
      oilLost: report.oilLost, gulfReserves: report.gulfReserves,
    });
    this.time.delayedCall(1500, () => {
      this.scene.stop('HUDScene');
      this.scene.start('GameOverScene', report);
    });
  }

  shutdown(): void {
    EventBus.off('siloLaunched',    undefined, this);
    EventBus.off('cityHit',         undefined, this);
    EventBus.off('cityDestroyed',   undefined, this);
    EventBus.off('shipSunk',        undefined, this);
    EventBus.off('reservesDepleted',undefined, this);
    EventBus.off('waveComplete',    undefined, this);
    EventBus.off('showAlert',       undefined, this);
    this.inputSystem.destroy();
  }
}

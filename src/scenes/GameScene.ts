import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, CITY_POSITIONS, SILO_POSITIONS, AIRCRAFT_START } from '../config/GameConfig';
import { BALANCE } from '../config/BalanceConfig';
import { Aircraft } from '../entities/Aircraft';
import { Bomb } from '../entities/Bomb';
import { AircraftMissile } from '../entities/AircraftMissile';
import { EnemyMissile } from '../entities/EnemyMissile';
import { Silo } from '../entities/Silo';
import { Ship } from '../entities/Ship';
import { City } from '../entities/City';
import { Explosion } from '../entities/Explosion';
import { WaveSystem } from '../systems/WaveSystem';
import { ShipSpawnSystem } from '../systems/ShipSpawnSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { InputSystem } from '../systems/InputSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { AlertBanner } from '../ui/AlertBanner';
import { OilSlick } from '../ui/OilSlick';
import { ObjectPool } from '../utils/ObjectPool';
import { EventBus } from '../utils/EventBus';
import { getWave } from '../config/LevelConfig';

const MAX_BOMBS = 20;
const MAX_MISSILES = 8;
const MAX_SHIPS = 6;
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
  private oilSlickPool!: ObjectPool<OilSlick>;
  private oilSlicks: OilSlick[] = [];

  private waveSystem!: WaveSystem;
  private shipSpawn!: ShipSpawnSystem;
  private collisions!: CollisionSystem;
  private inputSystem!: InputSystem;
  private scoreSystem!: ScoreSystem;

  private alertBanner!: AlertBanner;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private waveNumber: number = 1;
  private gameActive: boolean = false;
  private waveTransitionTimer: number = 0;
  private inWaveTransition: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.gameActive = true;
    this.waveNumber = 1;

    this.buildBackground();
    this.createEntities();
    this.createSystems();
    this.createHUD();
    this.bindEvents();

    // Launch HUD as parallel overlay scene
    this.scene.launch('HUDScene');

    // Start first wave
    this.waveSystem.startWave(1);
    this.shipSpawn.start();

    // Space key fallback (desktop)
    if (this.input.keyboard) {
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }
  }

  private buildBackground(): void {
    // Water (fill entire screen)
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a3058).setOrigin(0, 0).setDepth(0);

    // Water ripple rows
    for (let row = 4; row <= 12; row++) {
      if (row % 2 === 0) {
        this.add.rectangle(0, row * TILE_SIZE, GAME_WIDTH, TILE_SIZE, 0x1a3a6a).setOrigin(0, 0).setDepth(1);
      }
    }

    // North coast (Iran) — sandy brown
    this.add.rectangle(0, 0, GAME_WIDTH, TILE_SIZE * 4, 0x8B7355).setOrigin(0, 0).setDepth(1);
    // Edge line
    this.add.rectangle(0, TILE_SIZE * 4 - 1, GAME_WIDTH, 1, 0x6a5a3a).setOrigin(0, 0).setDepth(2);

    // Rock formations on north coast
    for (let x = 0; x < GAME_WIDTH; x += 40) {
      const rockY = TILE_SIZE * (1 + Math.floor(Math.sin(x * 0.1) * 1.5 + 1.5));
      this.add.rectangle(x, rockY, 8 + (x % 12), 4, 0x666655).setOrigin(0, 0).setDepth(2);
    }

    // South coast (Gulf states) — lighter sand
    this.add.rectangle(0, TILE_SIZE * 13, GAME_WIDTH, TILE_SIZE * 4, 0xc4a472).setOrigin(0, 0).setDepth(1);
    this.add.rectangle(0, TILE_SIZE * 13, GAME_WIDTH, 1, 0xa08040).setOrigin(0, 0).setDepth(2);

    // Ship lane markers (faint)
    for (const laneY of [TILE_SIZE * 6, TILE_SIZE * 10]) {
      this.add.rectangle(0, laneY, GAME_WIDTH, 1, 0x2244aa, 0.2).setOrigin(0, 0).setDepth(2);
    }

    // "IRAN" label on north coast
    this.add.text(4, 4, 'IRAN', {
      fontSize: '4px', color: '#ccbbaa', fontFamily: 'monospace'
    }).setDepth(5);

    // "GULF STATES" label on south coast
    this.add.text(4, TILE_SIZE * 13 + 4, 'GULF STATES', {
      fontSize: '4px', color: '#ccbbaa', fontFamily: 'monospace'
    }).setDepth(5);

    // Strait of Hormuz label
    this.add.text(GAME_WIDTH / 2, TILE_SIZE * 8, 'STRAIT OF HORMUZ', {
      fontSize: '4px', color: 'rgba(100,140,200,0.4)', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(2);
  }

  private createEntities(): void {
    // Silos
    for (let i = 0; i < SILO_POSITIONS.length; i++) {
      const pos = SILO_POSITIONS[i];
      const silo = new Silo(this, pos.x, pos.y, i, 1);
      this.silos.push(silo);
    }

    // Cities
    for (let i = 0; i < CITY_POSITIONS.length; i++) {
      const pos = CITY_POSITIONS[i];
      const city = new City(this, pos.x, pos.y, i, pos.name);
      this.cities.push(city);
    }

    // Aircraft
    this.aircraft = new Aircraft(this, AIRCRAFT_START.x, AIRCRAFT_START.y);

    // Object pools
    this.explosionPool = new ObjectPool<Explosion>(
      () => new Explosion(this),
      (e) => { e.setVisible(false); },
      MAX_EXPLOSIONS
    );

    const oilSlickInstances: OilSlick[] = [];
    this.oilSlickPool = new ObjectPool<OilSlick>(
      () => { const o = new OilSlick(this); oilSlickInstances.push(o); return o; },
      (_o) => {},
      MAX_OIL_SLICKS
    );
    this.oilSlicks = oilSlickInstances;

    // Pre-allocate bombs
    for (let i = 0; i < MAX_BOMBS; i++) {
      this.bombs.push(new Bomb(this));
    }

    // Pre-allocate player missiles
    for (let i = 0; i < MAX_MISSILES; i++) {
      this.playerMissiles.push(new AircraftMissile(this));
    }

    // Pre-allocate enemy missiles
    for (let i = 0; i < MAX_ENEMY_MISSILES; i++) {
      this.enemyMissiles.push(new EnemyMissile(this));
    }

    // Pre-allocate ships
    for (let i = 0; i < MAX_SHIPS; i++) {
      this.ships.push(new Ship(this, i));
    }
  }

  private createSystems(): void {
    this.scoreSystem = new ScoreSystem();

    this.waveSystem = new WaveSystem(this, this.silos, this.cities, this.ships);
    this.shipSpawn = new ShipSpawnSystem(this, this.ships, BALANCE.ships.spawnIntervalSeconds);

    this.collisions = new CollisionSystem(
      this, this.bombs, this.playerMissiles, this.enemyMissiles,
      this.silos, this.ships, this.cities,
      this.explosionPool, this.oilSlickPool
    );

    this.inputSystem = new InputSystem(
      this, this.aircraft, this.silos,
      {
        onDropBomb: (tx, ty) => this.handleDropBomb(tx, ty),
        onFireMissile: (idx) => this.handleFireMissile(idx),
        onTapBombButton: () => this.handleBombButton(),
        onTapMissileButton: () => this.handleMissileButton(),
      }
    );
  }

  private createHUD(): void {
    this.alertBanner = new AlertBanner(this);

    // Touch control buttons (drawn in GameScene so they're on game camera)
    const bombBtn = this.add.rectangle(28, GAME_HEIGHT - 22, 30, 18, 0x334455, 0.85)
      .setDepth(60)
      .setScrollFactor(0)
      .setStrokeStyle(1, 0x88aacc, 0.7)
      .setInteractive();

    this.add.text(28, GAME_HEIGHT - 22, '💣BOMB', {
      fontSize: '4px', color: '#88aaff', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(61).setScrollFactor(0);

    bombBtn.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      ptr.event.stopPropagation();
      this.handleBombButton();
    });

    const missileBtn = this.add.rectangle(GAME_WIDTH - 34, GAME_HEIGHT - 22, 36, 18, 0x443355, 0.85)
      .setDepth(60)
      .setScrollFactor(0)
      .setStrokeStyle(1, 0xaa88cc, 0.7)
      .setInteractive();

    this.add.text(GAME_WIDTH - 34, GAME_HEIGHT - 22, '🚀MISSILE', {
      fontSize: '4px', color: '#cc88ff', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(61).setScrollFactor(0);

    missileBtn.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      ptr.event.stopPropagation();
      this.handleMissileButton();
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
        this.cameras.main.shake(200, 0.01);
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

    EventBus.on('shipSunk', ({ x, y }) => {
      this.alertBanner.show('🚢 TANKER SUNK — OIL SPILL!', 0x884400);
      this.cameras.main.shake(150, 0.008);
      void x; void y;
    }, this);

    EventBus.on('reservesDepleted', () => {
      this.endGame(false);
    }, this);

    EventBus.on('waveComplete', ({ waveNumber }) => {
      this.alertBanner.show(`✓ WAVE ${waveNumber} COMPLETE`, 0x225522, 2500);
      this.inWaveTransition = true;
      this.waveTransitionTimer = 3000;
      this.shipSpawn.stop();
    }, this);

    EventBus.on('showAlert', ({ message, color }) => {
      this.alertBanner.show(message, color ?? 0xcc0000);
    }, this);
  }

  // ─── Drop a bomb ────────────────────────────────────────────────────────────

  private handleDropBomb(targetX?: number, targetY?: number): void {
    if (!this.gameActive) return;
    const tx = targetX ?? this.aircraft.x;
    const ty = targetY ?? this.aircraft.y + 40;
    const bomb = this.getFreeBomb();
    if (!bomb) return;
    if (!this.aircraft.dropBomb(tx, ty)) return;
    bomb.launch(this.aircraft.x, this.aircraft.y, tx, ty, () => {});
  }

  private handleBombButton(): void {
    // Drop bomb directly below aircraft (toward silos or just south)
    const lockedIdx = this.silos.findIndex(s => s.siloId === this.aircraft.getLockedSiloId());
    if (lockedIdx !== -1) {
      const silo = this.silos[lockedIdx];
      this.handleDropBomb(silo.x, silo.y);
    } else {
      this.handleDropBomb(this.aircraft.x, this.aircraft.y + TILE_SIZE * 4);
    }
  }

  private handleFireMissile(siloIndex: number): void {
    if (!this.gameActive) return;
    if (!this.aircraft.fireMissile()) return;
    const silo = this.silos[siloIndex];
    if (!silo || silo.state === 'destroyed') return;
    const pm = this.getFreePlayerMissile();
    if (!pm) return;
    pm.launch(this.aircraft.x, this.aircraft.y, silo.x, silo.y, () => {});
  }

  private handleMissileButton(): void {
    this.inputSystem.enterMissileSelectMode();
  }

  private getFreeBomb(): Bomb | undefined {
    return this.bombs.find(b => !b.active);
  }

  private getFreePlayerMissile(): AircraftMissile | undefined {
    return this.playerMissiles.find(m => !m.active);
  }

  // ─── Spawn enemy missile from silo ─────────────────────────────────────────

  private spawnEnemyMissile(siloId: number, targetX: number, targetY: number): void {
    const silo = this.silos.find(s => s.siloId === siloId);
    if (!silo) return;

    const em = this.enemyMissiles.find(m => !m.active);
    if (!em) return;

    // Determine target type
    const ship = this.ships.find(s => s.active && !s.isSunk &&
      Math.abs(s.x - targetX) < 20 && Math.abs(s.y - targetY) < 20);
    const city = this.cities.find(c => !c.isDestroyed &&
      Math.abs(c.x - targetX) < 20 && Math.abs(c.y - targetY) < 20);

    const targetType = ship ? 'ship' : 'city';
    const targetId = ship ? ship.shipId : (city ? city.cityId : 0);

    em.launch(silo.x, silo.y, targetX, targetY, targetType, targetId);
    this.alertBanner.show('⚠ MISSILE LAUNCHED!', 0xcc4400, 1500);
  }

  // ─── Main update loop ───────────────────────────────────────────────────────

  update(_time: number, delta: number): void {
    if (!this.gameActive) return;

    // Wave transition countdown
    if (this.inWaveTransition) {
      this.waveTransitionTimer -= delta;
      if (this.waveTransitionTimer <= 0) {
        this.inWaveTransition = false;
        this.waveNumber++;
        // Replenish some ammo
        this.aircraft.bombs = Math.min(
          this.aircraft.bombs + 6,
          BALANCE.aircraft.startingBombs
        );
        this.aircraft.missiles = Math.min(
          this.aircraft.missiles + 2,
          BALANCE.aircraft.startingMissiles
        );
        // Update silo HP for new wave
        const newWave = getWave(this.waveNumber);
        this.silos.forEach(s => { s.maxHp = newWave.siloHitPoints; });
        this.waveSystem.startWave(this.waveNumber);
        this.shipSpawn.setInterval(newWave.shipInterval);
        this.shipSpawn.start();
        this.alertBanner.show(`WAVE ${this.waveNumber} — ${newWave.description}`, 0x113388, 2500);
      }
      // Still update everything during transition
    }

    // 1. Input
    this.inputSystem.update(delta);

    // 2. Aircraft movement + auto-bomb
    this.aircraft.update(delta);

    // Auto-bomb when in range of locked silo
    const lockedSiloId = this.aircraft.getLockedSiloId();
    if (lockedSiloId !== -1) {
      const silo = this.silos.find(s => s.siloId === lockedSiloId);
      if (silo && silo.state !== 'destroyed' && this.aircraft.isAtBombRange(silo.x, silo.y)) {
        this.handleDropBomb(silo.x, silo.y);
      }
    }

    // Space key = drop bomb (desktop)
    if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.handleBombButton();
    }

    // 3. Wave logic
    this.waveSystem.update(delta);

    // 4. Silos
    for (const silo of this.silos) {
      silo.update(delta);
    }

    // 5. Enemy missiles
    for (const em of this.enemyMissiles) {
      em.update(delta);
    }

    // 6. Player bombs
    for (const bomb of this.bombs) {
      bomb.update(delta);
    }

    // 7. Player missiles
    for (const pm of this.playerMissiles) {
      pm.update(delta);
    }

    // 8. Collision detection
    this.collisions.update();

    // 9. Ships
    this.shipSpawn.update(delta);
    for (const ship of this.ships) {
      ship.update(delta);
    }

    // 10. Oil slicks
    for (const slick of this.oilSlicks) {
      slick.update(delta);
    }

    // 11. Game over check
    if (this.scoreSystem.isGameOver()) {
      this.endGame(false);
    }
  }

  private endGame(victory: boolean): void {
    if (!this.gameActive) return;
    this.gameActive = false;
    this.shipSpawn.stop();

    const report = {
      ...this.scoreSystem.getReport(),
      wave: this.waveNumber,
      victory,
    };

    EventBus.emit('gameOver', {
      score: report.score,
      oilTransported: report.oilTransported,
      oilLost: report.oilLost,
      gulfReserves: report.gulfReserves,
    });

    this.time.delayedCall(1500, () => {
      this.scene.stop('HUDScene');
      this.scene.start('GameOverScene', report);
    });
  }

  shutdown(): void {
    EventBus.off('siloLaunched', undefined, this);
    EventBus.off('cityHit', undefined, this);
    EventBus.off('cityDestroyed', undefined, this);
    EventBus.off('shipSunk', undefined, this);
    EventBus.off('reservesDepleted', undefined, this);
    EventBus.off('waveComplete', undefined, this);
    EventBus.off('showAlert', undefined, this);
    this.inputSystem.destroy();
  }
}

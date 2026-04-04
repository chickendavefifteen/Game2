import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, TILE_SIZE,
  CITY_POSITIONS, SILO_POSITIONS, AIRCRAFT_START,
  northCoastY, southCoastY,
  WATER_Y_MIN, WATER_Y_MAX,
} from '../config/GameConfig';
import { BALANCE, DIFFICULTIES, Difficulty, DifficultyConfig } from '../config/BalanceConfig';
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
import { sounds }          from '../audio/SoundSystem';

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
  private difficulty!: DifficultyConfig;
  private difficultyKey: Difficulty = 'sergeant';
  private waveClearOverlay: Phaser.GameObjects.Container | null = null;
  private paused = false;
  private pauseOverlay: Phaser.GameObjects.Container | null = null;

  constructor() { super({ key: 'GameScene' }); }

  create(): void {
    this.gameActive = true;
    this.waveNumber = 1;

    // Read difficulty from registry
    this.difficultyKey = (this.registry.get('difficulty') as Difficulty) ?? 'sergeant';
    this.difficulty = DIFFICULTIES[this.difficultyKey];

    this.buildBackground();
    this.createEntities();
    this.createSystems();
    this.createHUD();
    this.bindEvents();

    this.scene.launch('HUDScene', { difficultyKey: this.difficultyKey });
    this.waveSystem.startWave(1);
    this.shipSpawn.start();

    if (this.input.keyboard) {
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    // Unlock AudioContext on first pointer interaction
    this.input.once('pointerdown', () => sounds.init());

    this.showFirstWaveTip();
  }

  // ── Background: full-gradient Hormuz strait map ─────────────────────────

  private buildBackground(): void {
    // Use a canvas texture so we can apply real CSS gradients
    const tex = this.textures.createCanvas('mapBg', GAME_WIDTH, GAME_HEIGHT)!;
    const ctx = tex.getContext()!;

    // ── Deep water fill ──────────────────────────────────────────────────────
    const seaGrad = ctx.createLinearGradient(0, WATER_Y_MIN, 0, WATER_Y_MAX);
    seaGrad.addColorStop(0,   '#0d2248');
    seaGrad.addColorStop(0.4, '#143060');
    seaGrad.addColorStop(1,   '#1a3a70');
    ctx.fillStyle = seaGrad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // ── Wave stripes (horizontal shimmer bands) ──
    for (let y = WATER_Y_MIN; y < WATER_Y_MAX; y += 9) {
      ctx.fillStyle = 'rgba(80,140,220,0.08)';
      ctx.fillRect(0, y, GAME_WIDTH, 4);
    }

    // ── Iranian land (north) — warm sandy desert ──────────────────────────
    for (let x = 0; x < GAME_WIDTH; x++) {
      const ny = northCoastY(x);
      const t  = x / GAME_WIDTH;
      // gradient: olive-grey (west) → warm tan (east)
      const r = Math.round(120 + t * 20);
      const g = Math.round(100 + t * 10);
      const b = Math.round(60  + t * 5);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, 0, 1, ny);
    }
    // land highlight band at top (sky suggestion)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 30);
    skyGrad.addColorStop(0, 'rgba(60,80,140,0.45)');
    skyGrad.addColorStop(1, 'rgba(60,80,140,0)');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, GAME_WIDTH, 30);

    // ── Gulf states land (south) — lighter sandy-gold ─────────────────────
    for (let x = 0; x < GAME_WIDTH; x++) {
      const sy = southCoastY(x);
      const t  = x / GAME_WIDTH;
      const r = Math.round(200 + t * 10);
      const g = Math.round(170 + t * 5);
      const b = Math.round(100 + t * 5);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, sy, 1, GAME_HEIGHT - sy);
    }

    // ── Shallow water fringe — north coast ────────────────────────────────
    for (let x = 0; x < GAME_WIDTH; x++) {
      const ny = northCoastY(x);
      const shallowGrad = ctx.createLinearGradient(x, ny, x, ny + 18);
      shallowGrad.addColorStop(0, 'rgba(30,100,180,0.55)');
      shallowGrad.addColorStop(1, 'rgba(20,60,140,0)');
      ctx.fillStyle = shallowGrad;
      ctx.fillRect(x, ny, 1, 18);
    }

    // ── Shallow water fringe — south coast ────────────────────────────────
    for (let x = 0; x < GAME_WIDTH; x++) {
      const sy = southCoastY(x);
      const shallowGrad = ctx.createLinearGradient(x, sy - 18, x, sy);
      shallowGrad.addColorStop(0, 'rgba(20,60,140,0)');
      shallowGrad.addColorStop(1, 'rgba(30,100,180,0.45)');
      ctx.fillStyle = shallowGrad;
      ctx.fillRect(x, sy - 18, 1, 18);
    }

    // ── North cliff edge ─────────────────────────────────────────────────
    ctx.strokeStyle = '#5a4a2a';
    ctx.lineWidth   = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, northCoastY(0));
    for (let x = 1; x < GAME_WIDTH; x++) ctx.lineTo(x, northCoastY(x));
    ctx.stroke();
    // highlight
    ctx.strokeStyle = 'rgba(255,230,160,0.35)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(0, northCoastY(0) - 1);
    for (let x = 1; x < GAME_WIDTH; x++) ctx.lineTo(x, northCoastY(x) - 1);
    ctx.stroke();

    // ── South beach edge ──────────────────────────────────────────────────
    ctx.strokeStyle = '#a08040';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(0, southCoastY(0));
    for (let x = 1; x < GAME_WIDTH; x++) ctx.lineTo(x, southCoastY(x));
    ctx.stroke();

    // ── Rock formations on north coast ────────────────────────────────────
    const rocks = [[28,0.9],[55,1.1],[80,0.8],[120,1.0],[155,0.9],[190,1.1],[220,1.0],[248,0.85]];
    for (const [rx, scale] of rocks) {
      const ry = northCoastY(rx as number);
      const rw = (8 + (rx as number % 8)) * (scale as number);
      const rh = (5 + (rx as number % 5)) * (scale as number);
      const rg = ctx.createRadialGradient(rx as number, ry - rh * 0.3, 0, rx as number, ry, rw);
      rg.addColorStop(0, '#7a6850');
      rg.addColorStop(1, '#3a2a18');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.ellipse(rx as number, ry - rh * 0.4, rw * 0.6, rh * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      // highlight
      ctx.fillStyle = 'rgba(220,190,130,0.35)';
      ctx.beginPath();
      ctx.ellipse(rx as number - rw * 0.15, ry - rh * 0.6, rw * 0.25, rh * 0.25, -0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Desert dune texture — north land ─────────────────────────────────
    ctx.strokeStyle = 'rgba(160,130,70,0.2)';
    ctx.lineWidth   = 1;
    for (let di = 0; di < 12; di++) {
      const dy = 20 + di * 8;
      const amp = 4 + di * 2;
      ctx.beginPath();
      for (let x = 0; x < GAME_WIDTH; x++) {
        const ty = northCoastY(x);
        const wy = dy + amp * Math.sin((x / GAME_WIDTH) * Math.PI * 3 + di);
        if (wy < ty - 2) {
          x === 0 ? ctx.moveTo(x, wy) : ctx.lineTo(x, wy);
        } else {
          ctx.moveTo(x + 1, wy);
        }
      }
      ctx.stroke();
    }

    // ── Desert dune texture — south land ─────────────────────────────────
    ctx.strokeStyle = 'rgba(230,190,100,0.18)';
    for (let di = 0; di < 10; di++) {
      const dy = GAME_HEIGHT - 20 - di * 10;
      const amp = 5 + di * 2;
      ctx.beginPath();
      for (let x = 0; x < GAME_WIDTH; x++) {
        const sy = southCoastY(x);
        const wy = dy - amp * Math.sin((x / GAME_WIDTH) * Math.PI * 2.5 + di * 0.7);
        if (wy > sy + 2) {
          x === 0 ? ctx.moveTo(x, wy) : ctx.lineTo(x, wy);
        } else {
          ctx.moveTo(x + 1, wy);
        }
      }
      ctx.stroke();
    }

    // ── Hormuz Island ─────────────────────────────────────────────────────
    const [hix, hiy] = [232, 202];
    const hig = ctx.createRadialGradient(hix, hiy, 0, hix, hiy, 12);
    hig.addColorStop(0, '#b09868');
    hig.addColorStop(0.7, '#8b7348');
    hig.addColorStop(1, '#4a3820');
    ctx.fillStyle = hig;
    ctx.beginPath(); ctx.ellipse(hix, hiy, 11, 7, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5a4828'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(hix, hiy, 11, 7, 0.2, 0, Math.PI * 2); ctx.stroke();
    // tiny green shrubs
    ctx.fillStyle = '#567a38';
    ctx.beginPath(); ctx.arc(hix - 2, hiy - 1, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(hix + 3, hiy + 1, 1.8, 0, Math.PI * 2); ctx.fill();

    // ── Qeshm Island ──────────────────────────────────────────────────────
    const [qix, qiy] = [80, 173];
    const qig = ctx.createRadialGradient(qix, qiy, 0, qix, qiy, 18);
    qig.addColorStop(0, '#a09060');
    qig.addColorStop(0.7, '#806840');
    qig.addColorStop(1, '#3a2810');
    ctx.fillStyle = qig;
    ctx.beginPath(); ctx.ellipse(qix, qiy, 17, 8, 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#4a3818'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(qix, qiy, 17, 8, 0.15, 0, Math.PI * 2); ctx.stroke();

    // ── Shallow water around islands ──────────────────────────────────────
    for (const [ix, iy, ir] of [[hix, hiy, 16], [qix, qiy, 22]]) {
      const sg = ctx.createRadialGradient(ix as number, iy as number, (ir as number) * 0.7, ix as number, iy as number, ir as number * 1.8);
      sg.addColorStop(0, 'rgba(30,120,200,0.3)');
      sg.addColorStop(1, 'rgba(20,70,140,0)');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(ix as number, iy as number, ir as number * 1.8, 0, Math.PI * 2); ctx.fill();
    }

    // ── Compass rose (bottom-right corner) ────────────────────────────────
    const [crx, cry] = [GAME_WIDTH - 18, WATER_Y_MAX - 12];
    ctx.fillStyle = 'rgba(180,200,240,0.18)';
    ctx.beginPath(); ctx.arc(crx, cry, 10, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(180,200,240,0.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(crx, cry, 10, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(180,200,240,0.5)';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('N', crx, cry - 6.5);
    // N arrow
    ctx.fillStyle = 'rgba(255,200,100,0.6)';
    ctx.beginPath();
    ctx.moveTo(crx, cry - 4); ctx.lineTo(crx - 2, cry + 2); ctx.lineTo(crx + 2, cry + 2);
    ctx.closePath(); ctx.fill();

    tex.refresh();
    this.add.image(0, 0, 'mapBg').setOrigin(0, 0).setDepth(0);

    // ── Ship lane markers (drawn on top, very faint) ──────────────────────
    const lanes = this.add.graphics().setDepth(1);
    for (const laneY of [210, 250, 285]) {
      lanes.lineStyle(1, 0x5588dd, 0.12);
      lanes.beginPath();
      for (let x = 0; x < GAME_WIDTH; x += 12) {
        lanes.moveTo(x, laneY);
        lanes.lineTo(x + 7, laneY);
      }
      lanes.strokePath();
    }

    // ── Map labels ────────────────────────────────────────────────────────
    this.add.text(10, 8, 'I R A N', {
      fontSize: '7px', color: '#c8b080', fontFamily: 'monospace',
      stroke: '#2a1a00', strokeThickness: 3,
    }).setDepth(5).setAlpha(0.65);

    this.add.text(6, GAME_HEIGHT - 18, 'GULF  STATES', {
      fontSize: '6px', color: '#e0c88a', fontFamily: 'monospace',
      stroke: '#2a1a00', strokeThickness: 3,
    }).setDepth(5).setAlpha(0.6);

    this.add.text(GAME_WIDTH / 2, 235, '— STRAIT OF HORMUZ —', {
      fontSize: '5px', color: '#88aad0', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(2).setAlpha(0.22);
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
    // Apply difficulty starting ammo (set after construction — aircraft defaults are overridden)
    // We'll apply these in createSystems() once difficulty is known

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
    // Apply difficulty ammo loadout
    this.aircraft.bombs   = this.difficulty.startingBombs;
    this.aircraft.missiles = this.difficulty.startingMissiles;

    this.scoreSystem = new ScoreSystem(this.difficulty);
    this.waveSystem  = new WaveSystem(this, this.silos, this.cities, this.ships, this.difficulty.timerMultiplier);
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

  private bombCountText!:    Phaser.GameObjects.Text;
  private missileCountText!: Phaser.GameObjects.Text;

  private createHUD(): void {
    this.alertBanner = new AlertBanner(this);

    // These must match HUDScene layout constants
    const BTN_H = 52;
    const RES_H = 24;
    const BTN_TOP = GAME_HEIGHT - BTN_H;      // y where button zone starts (428)
    const BY      = BTN_TOP + BTN_H / 2;      // button centre Y (454)
    const BW      = 128;

    // Dark button panel background
    const panelGfx = this.add.graphics().setDepth(59).setScrollFactor(0);
    panelGfx.fillGradientStyle(0x040810, 0x040810, 0x080c18, 0x080c18, 0.97);
    panelGfx.fillRect(0, BTN_TOP, GAME_WIDTH, BTN_H);
    panelGfx.fillStyle(0x1a2d44, 0.7);
    panelGfx.fillRect(0, BTN_TOP, GAME_WIDTH, 1);

    const gfx = this.add.graphics().setDepth(61).setScrollFactor(0);

    const drawBtn = (bx: number, baseColor: number, accentColor: number) => {
      const r = 9;
      gfx.fillStyle(accentColor, 0.22);
      gfx.fillRoundedRect(bx - 2, BTN_TOP + 2, BW + 4, BTN_H - 4, r + 2);
      gfx.fillStyle(baseColor, 0.97);
      gfx.fillRoundedRect(bx, BTN_TOP + 4, BW, BTN_H - 8, r);
      gfx.fillStyle(0xffffff, 0.1);
      gfx.fillRoundedRect(bx + 2, BTN_TOP + 5, BW - 4, (BTN_H - 8) / 2, r);
      gfx.lineStyle(2, accentColor, 0.9);
      gfx.strokeRoundedRect(bx, BTN_TOP + 4, BW, BTN_H - 8, r);
    };

    // ── BOMB button — left ────────────────────────────────────────────────
    const bx1 = 4;
    drawBtn(bx1, 0x0b1e38, 0x2277cc);
    const bombHit = this.add.rectangle(bx1 + BW / 2, BY, BW, BTN_H - 10, 0, 0)
      .setDepth(60).setScrollFactor(0).setInteractive();

    this.add.text(bx1 + 12, BY - 2, '💣', {
      fontSize: '16px', fontFamily: 'monospace',
    }).setOrigin(0, 0.5).setDepth(62).setScrollFactor(0);

    this.add.text(bx1 + 36, BY - 9, 'BOMB', {
      fontSize: '11px', color: '#88ccff', fontFamily: 'monospace',
      stroke: '#000816', strokeThickness: 3,
    }).setOrigin(0, 0.5).setDepth(62).setScrollFactor(0);

    this.bombCountText = this.add.text(bx1 + 36, BY + 9, `×${this.aircraft?.bombs ?? BALANCE.aircraft.startingBombs}`, {
      fontSize: '9px', color: '#ffdd66', fontFamily: 'monospace',
      stroke: '#100800', strokeThickness: 2,
    }).setOrigin(0, 0.5).setDepth(62).setScrollFactor(0);

    bombHit.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      ptr.event.stopPropagation();
      this.handleBombButton();
      this.bombCountText.setText(`×${this.aircraft.bombs}`);
      this.tweens.add({ targets: bombHit, scaleX: 0.92, scaleY: 0.92, duration: 55, yoyo: true });
    });

    // ── MISSILE button — right ────────────────────────────────────────────
    const bx2 = GAME_WIDTH - 4 - BW;
    drawBtn(bx2, 0x180d38, 0x8822cc);
    const missileHit = this.add.rectangle(bx2 + BW / 2, BY, BW, BTN_H - 10, 0, 0)
      .setDepth(60).setScrollFactor(0).setInteractive();

    this.add.text(bx2 + 12, BY - 2, '🚀', {
      fontSize: '16px', fontFamily: 'monospace',
    }).setOrigin(0, 0.5).setDepth(62).setScrollFactor(0);

    this.add.text(bx2 + 36, BY - 9, 'MISSILE', {
      fontSize: '11px', color: '#cc88ff', fontFamily: 'monospace',
      stroke: '#080016', strokeThickness: 3,
    }).setOrigin(0, 0.5).setDepth(62).setScrollFactor(0);

    this.missileCountText = this.add.text(bx2 + 36, BY + 9, `×${this.aircraft?.missiles ?? BALANCE.aircraft.startingMissiles}`, {
      fontSize: '9px', color: '#ffdd66', fontFamily: 'monospace',
      stroke: '#100800', strokeThickness: 2,
    }).setOrigin(0, 0.5).setDepth(62).setScrollFactor(0);

    missileHit.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      ptr.event.stopPropagation();
      this.handleMissileButton();
      this.missileCountText.setText(`×${this.aircraft.missiles}`);
      this.tweens.add({ targets: missileHit, scaleX: 0.92, scaleY: 0.92, duration: 55, yoyo: true });
    });

    // ── TAP HINT (fades after 4 s) ────────────────────────────────────────
    const hintY = GAME_HEIGHT - BTN_H - RES_H - 20;
    const tapHint = this.add.text(GAME_WIDTH / 2, hintY, 'TAP A SILO TO INTERCEPT', {
      fontSize: '8px', color: '#ffffff', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(62).setAlpha(0.9);
    this.tweens.add({
      targets: tapHint, alpha: 0, delay: 4000, duration: 900,
      onComplete: () => tapHint.destroy(),
    });
  }

  private bindEvents(): void {
    EventBus.on('siloLaunched', ({ siloId, targetX, targetY }) => {
      this.spawnEnemyMissile(siloId, targetX, targetY);
      sounds.playMissileIncoming();
    }, this);

    EventBus.on('siloDestroyed', () => {
      sounds.playSiloDestroyed();
    }, this);

    EventBus.on('cityHit', ({ cityId }) => {
      const city = this.cities[cityId];
      if (city) {
        this.alertBanner.show(`⚠ ${city.cityName.toUpperCase()} HIT!`, 0xcc0000);
        this.cameras.main.shake(200, 0.012);
      }
      sounds.playCityHit();
    }, this);

    EventBus.on('cityDestroyed', ({ cityId }) => {
      const city = this.cities[cityId];
      if (city) {
        this.alertBanner.show(`💥 ${city.cityName.toUpperCase()} DESTROYED!`, 0x880000, 3000);
        this.scoreSystem.loseLife();
        this.cameras.main.shake(300, 0.02);
      }
      sounds.playExplosion('large');
      if (this.scoreSystem.isGameOver()) this.endGame(false);
    }, this);

    EventBus.on('shipSunk', () => {
      this.alertBanner.show('🚢 TANKER SUNK — OIL SPILL!', 0x884400);
      this.cameras.main.shake(150, 0.008);
      sounds.playShipSunk();
    }, this);

    EventBus.on('reservesDepleted', () => { this.endGame(false); }, this);

    EventBus.on('waveComplete', ({ waveNumber }) => {
      this.inWaveTransition = true;
      this.waveTransitionTimer = 4000;
      this.shipSpawn.stop();
      this.showWaveClearOverlay(waveNumber);
      sounds.playWaveClear();
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
    sounds.playBombDrop();
    EventBus.emit('shotFired', {});
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
    sounds.playMissileFire();
    EventBus.emit('shotFired', {});
    this.missileCountText.setText(`×${this.aircraft.missiles}`);
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
        if (this.waveClearOverlay) {
          this.waveClearOverlay.destroy();
          this.waveClearOverlay = null;
        }
        // Check victory (all 10 waves done)
        if (this.waveNumber >= 10) {
          this.endGame(true);
          return;
        }
        this.waveNumber++;
        const bombRefill    = 6;
        const missileRefill = 2;
        this.aircraft.bombs    = Math.min(this.aircraft.bombs    + bombRefill,    this.difficulty.startingBombs);
        this.aircraft.missiles = Math.min(this.aircraft.missiles + missileRefill, this.difficulty.startingMissiles);
        this.bombCountText.setText(`×${this.aircraft.bombs}`);
        this.missileCountText.setText(`×${this.aircraft.missiles}`);
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

  private showFirstWaveTip(): void {
    // Arrow pointing at first active silo
    const silo = this.silos[0];
    if (!silo) return;

    const tipContainer = this.add.container(silo.x, silo.y - 36).setDepth(85);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.72);
    bg.fillRoundedRect(-62, -14, 124, 24, 6);
    bg.fillStyle(0xffcc00, 0.9);
    bg.fillTriangle(0, 10, -6, 0, 6, 0);
    tipContainer.add(bg);

    const label = this.add.text(0, -6, 'TAP SILO → MISSILE', {
      fontSize: '8px', color: '#ffee44', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);
    tipContainer.add(label);

    tipContainer.setAlpha(0);
    this.tweens.add({ targets: tipContainer, alpha: 1, duration: 400, ease: 'Sine.easeOut' });
    this.tweens.add({
      targets: tipContainer, alpha: 0,
      delay: 4500, duration: 600,
      onComplete: () => tipContainer.destroy(),
    });
  }

  togglePause(): void {
    if (!this.gameActive && !this.paused) return;
    this.paused = !this.paused;
    sounds.playClick();

    if (this.paused) {
      this.physics.pause();
      this.time.paused = true;
      this.showPauseOverlay();
    } else {
      this.physics.resume();
      this.time.paused = false;
      if (this.pauseOverlay) {
        this.pauseOverlay.destroy();
        this.pauseOverlay = null;
      }
    }
  }

  private showPauseOverlay(): void {
    const CX = GAME_WIDTH / 2;
    const CY = GAME_HEIGHT / 2;
    const container = this.add.container(CX, CY).setDepth(200);
    this.pauseOverlay = container;

    const shade = this.add.graphics();
    shade.fillStyle(0x000000, 0.65);
    shade.fillRect(-CX, -CY, GAME_WIDTH, GAME_HEIGHT);
    container.add(shade);

    const card = this.add.graphics();
    card.fillStyle(0x060e1c, 0.97);
    card.fillRoundedRect(-90, -70, 180, 140, 12);
    card.lineStyle(2.5, 0x2255aa, 0.9);
    card.strokeRoundedRect(-90, -70, 180, 140, 12);
    container.add(card);

    container.add(this.add.text(0, -52, '⏸  PAUSED', {
      fontSize: '14px', color: '#ffffff', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5));

    // Resume button
    const resumeGfx = this.add.graphics();
    const drawResume = (h: boolean) => {
      resumeGfx.clear();
      resumeGfx.fillStyle(h ? 0x1e4a1e : 0x122a12, 0.97);
      resumeGfx.fillRoundedRect(-72, -18, 144, 32, 8);
      resumeGfx.lineStyle(2, 0x44ff44, h ? 0.9 : 0.6);
      resumeGfx.strokeRoundedRect(-72, -18, 144, 32, 8);
    };
    drawResume(false);
    container.add(resumeGfx);
    container.add(this.add.text(0, -2, '▶  RESUME', {
      fontSize: '10px', color: '#55ff55', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5));

    const resumeHit = this.add.rectangle(0, -2, 144, 32, 0, 0).setInteractive();
    resumeHit.on('pointerover', () => drawResume(true));
    resumeHit.on('pointerout',  () => drawResume(false));
    resumeHit.on('pointerdown', () => this.togglePause());
    container.add(resumeHit);

    // Quit button
    const quitGfx = this.add.graphics();
    const drawQuit = (h: boolean) => {
      quitGfx.clear();
      quitGfx.fillStyle(h ? 0x2a0e0e : 0x160808, 0.97);
      quitGfx.fillRoundedRect(-72, 24, 144, 28, 8);
      quitGfx.lineStyle(2, 0xcc2222, h ? 0.9 : 0.5);
      quitGfx.strokeRoundedRect(-72, 24, 144, 28, 8);
    };
    drawQuit(false);
    container.add(quitGfx);
    container.add(this.add.text(0, 38, '◀  QUIT TO MENU', {
      fontSize: '8px', color: '#ff6666', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5));

    const quitHit = this.add.rectangle(0, 38, 144, 28, 0, 0).setInteractive();
    quitHit.on('pointerover', () => drawQuit(true));
    quitHit.on('pointerout',  () => drawQuit(false));
    quitHit.on('pointerdown', () => {
      this.paused = false;
      this.physics.resume();
      this.time.paused = false;
      this.scene.stop('HUDScene');
      this.scene.start('MenuScene');
    });
    container.add(quitHit);

    container.setAlpha(0);
    this.tweens.add({ targets: container, alpha: 1, duration: 200 });
  }

  private showWaveClearOverlay(waveNumber: number): void {
    const isLast  = waveNumber >= 10;
    const perfect = this.scoreSystem.getEfficiency() >= 80;

    // Award bonus
    this.scoreSystem.addWaveClearBonus(perfect);

    const CX = GAME_WIDTH / 2;
    const CY = GAME_HEIGHT / 2 - 30;
    const W  = GAME_WIDTH - 32;

    const container = this.add.container(CX, CY).setDepth(90);
    this.waveClearOverlay = container;

    // Dark card
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.78);
    bg.fillRoundedRect(-W / 2, -70, W, 140, 14);
    bg.lineStyle(2.5, isLast ? 0xffcc00 : 0x22aa44, 0.9);
    bg.strokeRoundedRect(-W / 2, -70, W, 140, 14);
    // top gloss
    bg.fillStyle(0xffffff, 0.06);
    bg.fillRoundedRect(-W / 2 + 4, -68, W - 8, 50, 12);
    container.add(bg);

    // Header
    const header = isLast ? '★ MISSION COMPLETE ★' : `✓ WAVE ${waveNumber} CLEAR`;
    const headerColor = isLast ? '#ffcc00' : '#44ff88';
    const hdrText = this.add.text(0, -54, header, {
      fontSize: isLast ? '13px' : '14px', color: headerColor,
      fontFamily: 'monospace', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);
    container.add(hdrText);

    // Stars (1–3 based on wave number milestone and efficiency)
    const stars = perfect ? 3 : waveNumber % 3 === 0 ? 2 : 1;
    const starText = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    const starColors = ['#555533', '#555533', '#555533'];
    const litColor   = '#ffcc00';
    // render as plain text with colour trick via two overlapping texts
    this.add.text(0, -34, '★★★', {
      fontSize: '20px', color: '#222211', fontFamily: 'monospace',
    }).setOrigin(0.5);   // dim backing — not added to container, just direct (container.add below)
    const starBg = this.add.text(0, -34, '★★★', {
      fontSize: '20px', color: '#222211', fontFamily: 'monospace',
    }).setOrigin(0.5);
    const starFg = this.add.text(0, -34, starText.replace(/★/g, '★').replace(/☆/g, ''), {
      fontSize: '20px', color: litColor, fontFamily: 'monospace',
    }).setOrigin(0.5);
    void starColors;
    container.add([starBg, starFg]);

    // Bonus line
    const bonusAmt = perfect
      ? BALANCE.scoring.waveClearBonus + BALANCE.scoring.perfectWaveBonus
      : BALANCE.scoring.waveClearBonus;
    const bonusLabel = perfect ? `+${bonusAmt.toLocaleString()}  PERFECT CLEAR!` : `+${bonusAmt.toLocaleString()}  WAVE BONUS`;
    const bonusText = this.add.text(0, -8, bonusLabel, {
      fontSize: '9px', color: perfect ? '#ffee44' : '#88ffcc',
      fontFamily: 'monospace', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);
    container.add(bonusText);

    // Ammo refill (only if not last wave)
    if (!isLast) {
      const refillText = this.add.text(0, 10, `+6 💣   +2 🚀   REFILL`, {
        fontSize: '9px', color: '#88aadd', fontFamily: 'monospace',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5);
      container.add(refillText);
    }

    // Difficulty & multiplier badge
    const diffLabel = this.difficultyKey.toUpperCase();
    const multLabel = `×${this.difficulty.scoreMultiplier.toFixed(1)} MULTIPLIER`;
    const badgeText = this.add.text(0, 30, `${diffLabel}  ${multLabel}`, {
      fontSize: '7px', color: '#556677', fontFamily: 'monospace',
    }).setOrigin(0.5);
    container.add(badgeText);

    // Next wave label
    if (!isLast) {
      const nextText = this.add.text(0, 50, `WAVE ${waveNumber + 1} INCOMING…`, {
        fontSize: '8px', color: '#445566', fontFamily: 'monospace',
      }).setOrigin(0.5);
      container.add(nextText);
      this.tweens.add({ targets: nextText, alpha: 0.3, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // Slide-in
    container.setAlpha(0).setScale(0.88);
    this.tweens.add({ targets: container, alpha: 1, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.easeOut' });
  }

  private endGame(victory: boolean): void {
    if (!this.gameActive) return;
    this.gameActive = false;
    this.shipSpawn.stop();
    if (this.waveClearOverlay) {
      this.waveClearOverlay.destroy();
      this.waveClearOverlay = null;
    }
    const report = {
      ...this.scoreSystem.getReport(),
      wave: this.waveNumber,
      victory,
      difficulty: this.difficultyKey,
    };
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
    EventBus.off('siloDestroyed',   undefined, this);
    EventBus.off('cityHit',         undefined, this);
    EventBus.off('cityDestroyed',   undefined, this);
    EventBus.off('shipSunk',        undefined, this);
    EventBus.off('reservesDepleted',undefined, this);
    EventBus.off('waveComplete',    undefined, this);
    EventBus.off('showAlert',       undefined, this);
    if (this.time) this.time.paused = false;
    if (this.physics?.world) this.physics.resume();
    this.inputSystem.destroy();
  }
}

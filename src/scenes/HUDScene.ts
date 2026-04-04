import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { BALANCE, getRank, DIFFICULTIES, Difficulty } from '../config/BalanceConfig';
import { EventBus } from '../utils/EventBus';
import { sounds } from '../audio/SoundSystem';

export class HUDScene extends Phaser.Scene {
  private scoreText!:     Phaser.GameObjects.Text;
  private waveText!:      Phaser.GameObjects.Text;
  private livesRow!:      Phaser.GameObjects.Text;
  private rankText!:      Phaser.GameObjects.Text;
  private oilDelivered!:  Phaser.GameObjects.Text;
  private oilLostText!:   Phaser.GameObjects.Text;
  private reservesBar!:   Phaser.GameObjects.Graphics;
  private reservesLabel!: Phaser.GameObjects.Text;
  private reservesMax = BALANCE.oil.startingReserves;

  private difficultyKey: Difficulty = 'sergeant';

  constructor() { super({ key: 'HUDScene' }); }

  // Layout constants — must match GameScene button positions
  private static readonly TOP_H = 48;
  private static readonly BTN_H = 52;
  private static readonly RES_H = 24;
  private get resY(): number { return GAME_HEIGHT - HUDScene.BTN_H - HUDScene.RES_H; }

  private livesCount    = 3;
  private reservesRatio = 1.0;

  init(data: { difficultyKey?: Difficulty }): void {
    this.difficultyKey = data?.difficultyKey ?? 'sergeant';
  }

  create(): void {
    const diffConfig = DIFFICULTIES[this.difficultyKey] ?? DIFFICULTIES.sergeant;

    // ── TOP BAR (0 → TOP_H) ──────────────────────────────────────────────
    const TOP = HUDScene.TOP_H;
    const topGfx = this.add.graphics().setDepth(98);
    topGfx.fillGradientStyle(0x050c1c, 0x050c1c, 0x0b1628, 0x0b1628, 1);
    topGfx.fillRect(0, 0, GAME_WIDTH, TOP);
    topGfx.fillStyle(0x2255aa, 0.8);
    topGfx.fillRect(0, TOP - 1, GAME_WIDTH, 1);
    topGfx.fillStyle(0x3388ff, 0.5);
    topGfx.fillRect(0, 0, 3, TOP);

    // ── Score (left column) ──────────────────────────────────────────────
    this.add.text(10, 4, 'SCORE', {
      fontSize: '6px', color: '#3d6080', fontFamily: 'monospace',
    }).setDepth(100);
    this.scoreText = this.add.text(10, 12, '0', {
      fontSize: '14px', color: '#ffee55', fontFamily: 'monospace',
      stroke: '#110a00', strokeThickness: 3,
    }).setDepth(100);
    // Rank title under score
    this.rankText = this.add.text(10, 29, 'CONSCRIPT', {
      fontSize: '6px', color: '#888888', fontFamily: 'monospace',
    }).setDepth(100);

    // ── Wave (centre) ────────────────────────────────────────────────────
    this.add.text(GAME_WIDTH / 2, 4, 'WAVE', {
      fontSize: '6px', color: '#3d6080', fontFamily: 'monospace',
    }).setOrigin(0.5, 0).setDepth(100);
    this.waveText = this.add.text(GAME_WIDTH / 2, 13, '1', {
      fontSize: '18px', color: '#44ccff', fontFamily: 'monospace',
      stroke: '#001828', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(100);

    // ── Lives + difficulty (right column) ────────────────────────────────
    this.add.text(GAME_WIDTH - 10, 4, 'LIVES', {
      fontSize: '6px', color: '#3d6080', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(100);
    this.livesRow = this.add.text(GAME_WIDTH - 10, 13, '♥ ♥ ♥', {
      fontSize: '13px', color: '#ff2244', fontFamily: 'monospace',
      stroke: '#200010', strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(100);
    // Difficulty badge under lives
    this.add.text(GAME_WIDTH - 10, 29, diffConfig.label, {
      fontSize: '6px', color: diffConfig.color, fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(100);

    // ── Pause + Mute buttons ─────────────────────────────────────────────
    this.buildPauseButton();
    this.buildMuteButton();

    // ── RESERVES PANEL (just above buttons) ──────────────────────────────
    const RY = this.resY;
    const RH = HUDScene.RES_H;
    const resGfx = this.add.graphics().setDepth(98);
    resGfx.fillGradientStyle(0x030710, 0x030710, 0x05101a, 0x05101a, 0.95);
    resGfx.fillRect(0, RY, GAME_WIDTH, RH);
    resGfx.fillStyle(0x162840, 0.7);
    resGfx.fillRect(0, RY, GAME_WIDTH, 1);

    this.add.text(10, RY + 3, '⛽ RESERVES', {
      fontSize: '8px', color: '#4a7080', fontFamily: 'monospace',
    }).setDepth(100);
    this.reservesLabel = this.add.text(GAME_WIDTH - 10, RY + 3, '50.0 Mbbl', {
      fontSize: '8px', color: '#ffcc44', fontFamily: 'monospace',
      stroke: '#110800', strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(100);

    // Oil stats row
    this.oilDelivered = this.add.text(10, RY + 14, '🛢 0.0', {
      fontSize: '7px', color: '#33cc88', fontFamily: 'monospace',
    }).setDepth(100);
    this.oilLostText = this.add.text(GAME_WIDTH / 2, RY + 14, '☠ 0.0 Mbbl', {
      fontSize: '7px', color: '#ff7733', fontFamily: 'monospace',
    }).setDepth(100);

    // Reserves bar track
    const barTrack = this.add.graphics().setDepth(99);
    const BX = 10, BW = GAME_WIDTH - 20, BH = 7, BY2 = RY + 13;
    barTrack.fillStyle(0x0a1220);
    barTrack.fillRoundedRect(BX, BY2, BW, BH, 3);
    barTrack.lineStyle(1, 0x1a2a3a, 0.9);
    barTrack.strokeRoundedRect(BX, BY2, BW, BH, 3);

    this.reservesBar = this.add.graphics().setDepth(100);
    this.drawReservesBar(1.0);

    // ── EVENT LISTENERS ──────────────────────────────────────────────────
    EventBus.on('scoreChanged', ({ score }) => {
      this.scoreText.setText(score.toLocaleString());
      const rank = getRank(score);
      this.rankText.setText(rank.title.toUpperCase());
      this.rankText.setColor(rank.color);
    }, this);

    EventBus.on('livesChanged', ({ lives }) => {
      this.livesCount = lives;
      this.livesRow.setText(['', '♥', '♥ ♥', '♥ ♥ ♥'][Math.max(0, Math.min(3, lives))]);
      this.livesRow.setColor(lives <= 1 ? '#ff0000' : lives === 2 ? '#ff8800' : '#ff2244');
    }, this);

    EventBus.on('oilChanged', ({ transported, lost, reserves }) => {
      this.oilDelivered.setText(`🛢 ${(transported / 1e6).toFixed(1)}`);
      this.oilLostText.setText(`☠ ${(lost / 1e6).toFixed(1)} Mbbl`);
      this.reservesLabel.setText(`${(reserves / 1e6).toFixed(1)} Mbbl`);
      this.reservesRatio = reserves / this.reservesMax;
      this.drawReservesBar(this.reservesRatio);
    }, this);

    EventBus.on('waveComplete', ({ waveNumber }) => {
      this.waveText.setText(`${waveNumber + 1}`);
      this.tweens.add({ targets: this.waveText, scaleX: 1.5, scaleY: 1.5, duration: 180, yoyo: true });
    }, this);
  }

  private buildPauseButton(): void {
    // Sits in top-bar, centered — small ⏸ tap target
    const CX = GAME_WIDTH / 2;
    const gfx = this.add.graphics().setDepth(102);
    const draw = (hover: boolean) => {
      gfx.clear();
      gfx.fillStyle(0x1a2d44, hover ? 0.7 : 0.45);
      gfx.fillRoundedRect(CX - 15, 36, 30, 10, 4);
    };
    draw(false);
    this.add.text(CX, 41, '⏸', {
      fontSize: '8px', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(103);
    const hit = this.add.rectangle(CX, 41, 36, 14, 0, 0).setInteractive().setDepth(104);
    hit.on('pointerover',  () => draw(true));
    hit.on('pointerout',   () => draw(false));
    hit.on('pointerdown',  (ptr: Phaser.Input.Pointer) => {
      ptr.event.stopPropagation();
      const game = this.scene.get('GameScene') as any;
      if (game?.togglePause) game.togglePause();
    });
  }

  private buildMuteButton(): void {
    // Bottom-left of the button zone
    const BX = GAME_WIDTH / 2 - 14;
    const BY = GAME_HEIGHT - HUDScene.BTN_H / 2;
    let muteIcon: Phaser.GameObjects.Text;

    const gfx = this.add.graphics().setDepth(102);
    const draw = (muted: boolean, hover: boolean) => {
      gfx.clear();
      gfx.fillStyle(muted ? 0x330000 : 0x0a1828, hover ? 0.9 : 0.7);
      gfx.fillRoundedRect(BX - 14, BY - 10, 28, 20, 5);
      gfx.lineStyle(1, muted ? 0xaa2222 : 0x224466, 0.7);
      gfx.strokeRoundedRect(BX - 14, BY - 10, 28, 20, 5);
    };
    draw(sounds.muted, false);

    muteIcon = this.add.text(BX, BY, sounds.muted ? '🔇' : '🔊', {
      fontSize: '10px', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(103);

    const hit = this.add.rectangle(BX, BY, 28, 20, 0, 0).setInteractive().setDepth(104);
    hit.on('pointerover',  () => draw(sounds.muted, true));
    hit.on('pointerout',   () => draw(sounds.muted, false));
    hit.on('pointerdown',  (ptr: Phaser.Input.Pointer) => {
      ptr.event.stopPropagation();
      sounds.init();
      const nowMuted = sounds.toggleMute();
      muteIcon.setText(nowMuted ? '🔇' : '🔊');
      draw(nowMuted, false);
    });
  }

  private drawReservesBar(ratio: number): void {
    const RY = this.resY;
    const BX = 10, BW = GAME_WIDTH - 20, BH = 7, BY2 = RY + 13;
    const r  = 3;
    this.reservesBar.clear();

    const fillW = Math.max(0, Math.round(BW * ratio));
    if (fillW > 0) {
      const isCritical = ratio < 0.2, isLow = ratio < 0.45;
      const [c1, c2] = isCritical ? [0xcc2200, 0xff3300]
                     : isLow      ? [0xbb7700, 0xffaa00]
                     :              [0x116622, 0x22cc44];
      this.reservesBar.fillGradientStyle(c1, c2, c1, c2, 1);
      this.reservesBar.fillRoundedRect(BX, BY2, fillW, BH, r);
      this.reservesBar.fillStyle(0xffffff, 0.13);
      this.reservesBar.fillRoundedRect(BX + 1, BY2 + 1, fillW - 2, Math.floor(BH / 2), r);
    }

    // tick marks
    this.reservesBar.lineStyle(1, 0x000000, 0.25);
    for (let i = 1; i < 10; i++) {
      const tx = BX + Math.round((BW / 10) * i);
      this.reservesBar.lineBetween(tx, BY2 + 1, tx, BY2 + BH - 1);
    }

    // critical pulse
    if (ratio < 0.2 && Math.floor(Date.now() / 270) % 2 === 0) {
      this.reservesBar.fillStyle(0xff1100, 0.25);
      this.reservesBar.fillRoundedRect(BX, BY2, BW, BH, r);
    }
  }

  update(): void {
    if (this.reservesRatio < 0.2) this.drawReservesBar(this.reservesRatio);
  }

  shutdown(): void {
    EventBus.off('scoreChanged', undefined, this);
    EventBus.off('livesChanged', undefined, this);
    EventBus.off('oilChanged',   undefined, this);
    EventBus.off('waveComplete', undefined, this);
  }
}

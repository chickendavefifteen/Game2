import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';

interface MissionReport {
  score: number; oilTransported: number; oilLost: number;
  gulfReserves: number; silosDestroyed: number;
  shipsProtected: number; shipsSunk: number; wave: number; victory: boolean;
}

export class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  init(data: MissionReport): void { this.buildReport(data); }
  create(): void {}

  private buildReport(data: MissionReport): void {
    // ── Background overlay ────────────────────────────────────────────────
    const bgGfx = this.add.graphics();
    bgGfx.fillGradientStyle(0x000408, 0x000408, 0x020810, 0x020810, 0.94);
    bgGfx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // ── Victory/defeat banner ─────────────────────────────────────────────
    const victory = data.victory;
    const bannerColor = victory ? 0x113322 : 0x220a0a;
    const bannerAccent = victory ? 0x22aa44 : 0xcc2222;

    const bannerGfx = this.add.graphics();
    bannerGfx.fillGradientStyle(bannerColor, bannerColor, bannerColor >> 1, bannerColor >> 1, 1);
    bannerGfx.fillRect(0, 0, GAME_WIDTH, 26);
    bannerGfx.fillStyle(bannerAccent, 0.7);
    bannerGfx.fillRect(0, 25, GAME_WIDTH, 2);

    this.add.text(GAME_WIDTH / 2, 13, victory ? '✓  MISSION COMPLETE' : '✗  MISSION FAILED', {
      fontSize: '11px', color: victory ? '#44ff88' : '#ff4444', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    // ── Wave + score panel ────────────────────────────────────────────────
    this.add.text(GAME_WIDTH / 2, 34, `WAVE ${data.wave} REACHED`, {
      fontSize: '6px', color: '#6699bb', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);

    const scorePanel = this.add.graphics();
    scorePanel.fillStyle(0x080d18, 0.85);
    scorePanel.fillRoundedRect(20, 44, GAME_WIDTH - 40, 36, 7);
    scorePanel.lineStyle(1, 0x2244aa, 0.7);
    scorePanel.strokeRoundedRect(20, 44, GAME_WIDTH - 40, 36, 7);

    this.add.text(GAME_WIDTH / 2, 52, 'FINAL SCORE', {
      fontSize: '5px', color: '#4466aa', fontFamily: 'monospace',
    }).setOrigin(0.5);
    const scoreDisplay = this.add.text(GAME_WIDTH / 2, 63, '0', {
      fontSize: '15px', color: '#ffee66', fontFamily: 'monospace',
      stroke: '#110800', strokeThickness: 4,
    }).setOrigin(0.5);
    // Animate score count-up
    let counted = 0;
    const target = data.score;
    const tick = () => {
      counted = Math.min(counted + Math.max(1, Math.round(target / 40)), target);
      scoreDisplay.setText(counted.toLocaleString());
      if (counted < target) this.time.delayedCall(30, tick);
    };
    tick();

    // ── Stats card ────────────────────────────────────────────────────────
    const cardGfx = this.add.graphics();
    cardGfx.fillStyle(0x05090f, 0.82);
    cardGfx.fillRoundedRect(10, 88, GAME_WIDTH - 20, 142, 7);
    cardGfx.lineStyle(1, 0x1a2d44, 0.8);
    cardGfx.strokeRoundedRect(10, 88, GAME_WIDTH - 20, 142, 7);

    this.add.text(GAME_WIDTH / 2, 96, '── MISSION REPORT ──', {
      fontSize: '5px', color: '#3355aa', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const rows: [string, string, string][] = [
      ['🛢 OIL TRANSPORTED', `${(data.oilTransported/1e6).toFixed(1)} Mbbl`, '#55ffcc'],
      ['💧 OIL SPILLED',     `${(data.oilLost/1e6).toFixed(1)} Mbbl`,       '#ff7733'],
      ['⛽ GULF RESERVES',   `${(data.gulfReserves/1e6).toFixed(1)} Mbbl`,  '#ffcc44'],
      ['💥 SILOS DESTROYED', `${data.silosDestroyed}`,                      '#77ddff'],
      ['🚢 SHIPS PROTECTED', `${data.shipsProtected}`,                      '#55ffcc'],
      ['☠ SHIPS SUNK',      `${data.shipsSunk}`,                           '#ff6666'],
    ];

    rows.forEach(([label, value, color], i) => {
      const ry = 107 + i * 19;
      // alternating row tint
      if (i % 2 === 0) {
        cardGfx.fillStyle(0xffffff, 0.02);
        cardGfx.fillRect(11, ry - 2, GAME_WIDTH - 22, 19);
      }
      this.add.text(18, ry, label, {
        fontSize: '5px', color: '#889aaa', fontFamily: 'monospace',
      });
      this.add.text(GAME_WIDTH - 18, ry, value, {
        fontSize: '6px', color, fontFamily: 'monospace',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(1, 0);
    });

    // ── Transit efficiency bar ────────────────────────────────────────────
    const total = data.oilTransported + data.oilLost;
    const eff   = total > 0 ? Math.round((data.oilTransported / total) * 100) : 0;
    const effColor = eff >= 75 ? '#44ff88' : eff >= 40 ? '#ffcc00' : '#ff4444';
    this.add.text(GAME_WIDTH / 2, 242, `TRANSIT EFFICIENCY:  ${eff}%`, {
      fontSize: '6px', color: effColor, fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);
    // efficiency bar
    const effGfx = this.add.graphics();
    effGfx.fillStyle(0x0a0f18);
    effGfx.fillRoundedRect(20, 252, GAME_WIDTH - 40, 7, 3);
    effGfx.fillStyle(eff >= 75 ? 0x22aa44 : eff >= 40 ? 0xcc8800 : 0xcc2200);
    effGfx.fillRoundedRect(20, 252, Math.round((GAME_WIDTH - 40) * eff / 100), 7, 3);
    effGfx.lineStyle(1, 0x223344, 0.7);
    effGfx.strokeRoundedRect(20, 252, GAME_WIDTH - 40, 7, 3);

    // ── Action buttons ────────────────────────────────────────────────────
    const makeBtn = (label: string, cy: number, baseCol: number, accentCol: number, txtCol: string) => {
      const gfx = this.add.graphics();
      const drawB = (hover: boolean) => {
        gfx.clear();
        gfx.fillStyle(accentCol, hover ? 0.2 : 0.1);
        gfx.fillRoundedRect(GAME_WIDTH / 2 - 92, cy - 16, 184, 32, 9);
        gfx.fillStyle(baseCol, hover ? 0.95 : 0.88);
        gfx.fillRoundedRect(GAME_WIDTH / 2 - 90, cy - 15, 180, 30, 8);
        gfx.fillStyle(0xffffff, 0.07);
        gfx.fillRoundedRect(GAME_WIDTH / 2 - 88, cy - 14, 176, 14, 7);
        gfx.lineStyle(2, accentCol, 0.85);
        gfx.strokeRoundedRect(GAME_WIDTH / 2 - 90, cy - 15, 180, 30, 8);
      };
      drawB(false);
      this.add.text(GAME_WIDTH / 2, cy, label, {
        fontSize: '8px', color: txtCol, fontFamily: 'monospace',
        stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5);
      const hit = this.add.rectangle(GAME_WIDTH / 2, cy, 180, 30, 0, 0).setInteractive();
      hit.on('pointerover', () => drawB(true));
      hit.on('pointerout',  () => drawB(false));
      return hit;
    };

    const retryBtn = makeBtn('▶  RETRY MISSION', 294, 0x0d2a12, 0x33aa44, '#44ff88');
    retryBtn.on('pointerdown', () => {
      this.tweens.add({ targets: retryBtn, scaleX: 0.94, scaleY: 0.94, duration: 60, yoyo: true,
        onComplete: () => this.scene.start('GameScene') });
    });

    const menuBtn = makeBtn('◀  MAIN MENU', 332, 0x0d1228, 0x3366cc, '#88aaff');
    menuBtn.on('pointerdown', () => {
      this.tweens.add({ targets: menuBtn, scaleX: 0.94, scaleY: 0.94, duration: 60, yoyo: true,
        onComplete: () => this.scene.start('MenuScene') });
    });
  }
}

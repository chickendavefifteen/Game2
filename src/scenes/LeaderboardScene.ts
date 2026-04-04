import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { getLeaderboard, LeaderboardEntry, clearLeaderboard } from '../utils/Leaderboard';
import { DIFFICULTIES } from '../config/BalanceConfig';

const DIFF_COLORS: Record<string, string> = {
  recruit:   '#44ff88',
  sergeant:  '#ffee44',
  commander: '#ff8833',
  admiral:   '#ff2222',
};

export class LeaderboardScene extends Phaser.Scene {
  constructor() { super({ key: 'LeaderboardScene' }); }

  create(): void {
    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x010408, 0x010408, 0x040c1c, 0x040c1c, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Header band
    const hdr = this.add.graphics();
    hdr.fillGradientStyle(0x0a1830, 0x0a1830, 0x060f1e, 0x060f1e, 1);
    hdr.fillRect(0, 0, GAME_WIDTH, 54);
    hdr.fillStyle(0x2255aa, 0.6);
    hdr.fillRect(0, 53, GAME_WIDTH, 1);
    hdr.fillStyle(0x3388ff, 0.5);
    hdr.fillRect(0, 0, 3, 54);

    this.add.text(GAME_WIDTH / 2, 14, '🏆', {
      fontSize: '20px', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 38, 'HALL OF FAME', {
      fontSize: '12px', color: '#ffee44', fontFamily: 'monospace',
      stroke: '#110800', strokeThickness: 3,
    }).setOrigin(0.5);

    const entries = getLeaderboard();

    if (entries.length === 0) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'NO SCORES YET', {
        fontSize: '10px', color: '#445566', fontFamily: 'monospace',
      }).setOrigin(0.5);
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 8, 'Complete a mission to rank up!', {
        fontSize: '7px', color: '#334455', fontFamily: 'monospace',
      }).setOrigin(0.5);
    } else {
      this.buildTable(entries);
    }

    this.buildButtons(entries.length > 0);
  }

  private buildTable(entries: LeaderboardEntry[]): void {
    // Column header row
    const hY = 66;
    const rowH = 36;
    const colGfx = this.add.graphics();
    colGfx.fillStyle(0x0a1828, 0.9);
    colGfx.fillRect(0, hY, GAME_WIDTH, 14);
    colGfx.lineStyle(1, 0x1a2d44, 0.6);
    colGfx.lineBetween(0, hY + 14, GAME_WIDTH, hY + 14);

    this.add.text(8,   hY + 2, '#',       { fontSize: '6px', color: '#334466', fontFamily: 'monospace' });
    this.add.text(24,  hY + 2, 'NAME',    { fontSize: '6px', color: '#334466', fontFamily: 'monospace' });
    this.add.text(115, hY + 2, 'SCORE',   { fontSize: '6px', color: '#334466', fontFamily: 'monospace' });
    this.add.text(175, hY + 2, 'WV',      { fontSize: '6px', color: '#334466', fontFamily: 'monospace' });
    this.add.text(195, hY + 2, 'DIFF',    { fontSize: '6px', color: '#334466', fontFamily: 'monospace' });
    this.add.text(240, hY + 2, 'EFF%',    { fontSize: '6px', color: '#334466', fontFamily: 'monospace' });

    for (let i = 0; i < entries.length; i++) {
      const e   = entries[i];
      const ry  = hY + 14 + i * rowH;
      const rowGfx = this.add.graphics();

      // Alternating rows
      if (i % 2 === 0) {
        rowGfx.fillStyle(0x040c18, 0.9);
      } else {
        rowGfx.fillStyle(0x020810, 0.9);
      }
      rowGfx.fillRect(0, ry, GAME_WIDTH, rowH);

      // Top-3 gold/silver/bronze accent bar
      if (i < 3) {
        const accentColors = [0xffcc00, 0xaabbcc, 0xcc7722];
        rowGfx.fillStyle(accentColors[i], 0.15);
        rowGfx.fillRect(0, ry, 4, rowH);
      }

      // Rank number
      const rankColors = ['#ffcc00', '#aabbcc', '#cc7722'];
      const rankColor  = i < 3 ? rankColors[i] : '#445566';
      const rankLabel  = i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}`;
      this.add.text(8, ry + 4, rankLabel, {
        fontSize: i < 3 ? '11px' : '7px',
        color: rankColor, fontFamily: 'monospace',
      });

      // Name
      const nameCol = i === 0 ? '#ffffff' : i < 3 ? '#dddddd' : '#99aabb';
      this.add.text(24, ry + 6, e.name.substring(0, 10).toUpperCase(), {
        fontSize: '8px', color: nameCol, fontFamily: 'monospace',
        stroke: '#000', strokeThickness: 2,
      });

      // Date tiny
      const dateStr = new Date(e.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
      this.add.text(24, ry + 18, dateStr, {
        fontSize: '5px', color: '#334455', fontFamily: 'monospace',
      });

      // Score
      this.add.text(115, ry + 6, e.score.toLocaleString(), {
        fontSize: '8px', color: '#ffee44', fontFamily: 'monospace',
        stroke: '#110800', strokeThickness: 2,
      });

      // Wave
      this.add.text(178, ry + 6, `${e.wave}`, {
        fontSize: '8px', color: '#44ccff', fontFamily: 'monospace',
      });

      // Difficulty badge
      const diffLabel = e.difficulty.substring(0, 3).toUpperCase();
      const diffColor = DIFF_COLORS[e.difficulty] ?? '#ffffff';
      this.add.text(196, ry + 6, diffLabel, {
        fontSize: '7px', color: diffColor, fontFamily: 'monospace',
        stroke: '#000', strokeThickness: 2,
      });

      // Efficiency bar (mini)
      const effW = 30;
      const effFill = Math.round(effW * (e.efficiency / 100));
      const effGfx = this.add.graphics();
      effGfx.fillStyle(0x0a1220);
      effGfx.fillRoundedRect(235, ry + 7, effW, 6, 2);
      const effColor = e.efficiency >= 75 ? 0x22aa44 : e.efficiency >= 40 ? 0xcc8800 : 0xcc2200;
      if (effFill > 0) {
        effGfx.fillStyle(effColor);
        effGfx.fillRoundedRect(235, ry + 7, effFill, 6, 2);
      }
      effGfx.lineStyle(1, 0x1a2d44, 0.5);
      effGfx.strokeRoundedRect(235, ry + 7, effW, 6, 2);
      this.add.text(235, ry + 17, `${e.efficiency}%`, {
        fontSize: '5px', color: '#557788', fontFamily: 'monospace',
      });

      // row separator
      rowGfx.lineStyle(1, 0x0a1828, 0.8);
      rowGfx.lineBetween(0, ry + rowH - 1, GAME_WIDTH, ry + rowH - 1);
    }
  }

  private buildButtons(hasClear: boolean): void {
    const btmY = GAME_HEIGHT - 56;

    // BACK button
    const backGfx = this.add.graphics();
    const drawBack = (hover: boolean) => {
      backGfx.clear();
      backGfx.fillStyle(hover ? 0x1a2a3a : 0x0d1828, 0.95);
      backGfx.fillRoundedRect(14, btmY, 108, 34, 8);
      backGfx.lineStyle(2, 0x2255aa, hover ? 0.9 : 0.65);
      backGfx.strokeRoundedRect(14, btmY, 108, 34, 8);
    };
    drawBack(false);
    this.add.text(68, btmY + 17, '◀  MENU', {
      fontSize: '9px', color: '#88aaff', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);
    const backHit = this.add.rectangle(68, btmY + 17, 108, 34, 0, 0).setInteractive();
    backHit.on('pointerover',  () => drawBack(true));
    backHit.on('pointerout',   () => drawBack(false));
    backHit.on('pointerdown',  () => {
      this.tweens.add({ targets: backHit, scaleX: 0.94, scaleY: 0.94, duration: 60, yoyo: true,
        onComplete: () => this.scene.start('MenuScene') });
    });

    if (!hasClear) return;

    // CLEAR button
    const clearGfx = this.add.graphics();
    const drawClear = (hover: boolean) => {
      clearGfx.clear();
      clearGfx.fillStyle(hover ? 0x2a0d0d : 0x180808, 0.95);
      clearGfx.fillRoundedRect(148, btmY, 108, 34, 8);
      clearGfx.lineStyle(2, 0xaa2222, hover ? 0.9 : 0.5);
      clearGfx.strokeRoundedRect(148, btmY, 108, 34, 8);
    };
    drawClear(false);
    this.add.text(202, btmY + 17, '🗑  CLEAR', {
      fontSize: '9px', color: '#ff6666', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);
    const clearHit = this.add.rectangle(202, btmY + 17, 108, 34, 0, 0).setInteractive();
    clearHit.on('pointerover',  () => drawClear(true));
    clearHit.on('pointerout',   () => drawClear(false));
    clearHit.on('pointerdown',  () => {
      clearLeaderboard();
      this.scene.restart();
    });
  }
}

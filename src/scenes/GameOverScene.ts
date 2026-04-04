import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { getRank, DIFFICULTIES, Difficulty } from '../config/BalanceConfig';
import { saveScore, isHighScore } from '../utils/Leaderboard';
import { sounds } from '../audio/SoundSystem';

interface MissionReport {
  score: number; oilTransported: number; oilLost: number;
  gulfReserves: number; silosDestroyed: number;
  shipsProtected: number; shipsSunk: number;
  wave: number; victory: boolean;
  efficiency: number; difficulty: Difficulty;
}

const DIFF_COLORS: Record<string, string> = {
  recruit:   '#44ff88',
  sergeant:  '#ffee44',
  commander: '#ff8833',
  admiral:   '#ff2222',
};

export class GameOverScene extends Phaser.Scene {
  private data_!: MissionReport;
  private nameInput: HTMLInputElement | null = null;

  constructor() { super({ key: 'GameOverScene' }); }

  init(data: MissionReport): void { this.data_ = data; }

  create(): void {
    sounds.init();
    if (this.data_.victory) {
      sounds.playVictory();
    }
    this.buildReport(this.data_);
  }

  shutdown(): void {
    this.removeNameInput();
  }

  private removeNameInput(): void {
    if (this.nameInput) {
      this.nameInput.remove();
      this.nameInput = null;
    }
  }

  private buildReport(data: MissionReport): void {
    const rank       = getRank(data.score);
    const diffConfig = DIFFICULTIES[data.difficulty] ?? DIFFICULTIES.sergeant;
    const diffColor  = DIFF_COLORS[data.difficulty] ?? '#ffffff';

    // ── Background overlay ────────────────────────────────────────────────
    const bgGfx = this.add.graphics();
    bgGfx.fillGradientStyle(0x000408, 0x000408, 0x020810, 0x020810, 0.94);
    bgGfx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // ── Victory/defeat banner ─────────────────────────────────────────────
    const bannerColor  = data.victory ? 0x113322 : 0x220a0a;
    const bannerAccent = data.victory ? 0x22aa44 : 0xcc2222;

    const bannerGfx = this.add.graphics();
    bannerGfx.fillGradientStyle(bannerColor, bannerColor, bannerColor >> 1, bannerColor >> 1, 1);
    bannerGfx.fillRect(0, 0, GAME_WIDTH, 26);
    bannerGfx.fillStyle(bannerAccent, 0.7);
    bannerGfx.fillRect(0, 25, GAME_WIDTH, 2);

    this.add.text(GAME_WIDTH / 2, 13, data.victory ? '✓  MISSION COMPLETE' : '✗  MISSION FAILED', {
      fontSize: '11px', color: data.victory ? '#44ff88' : '#ff4444', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    // ── Rank + difficulty badges ──────────────────────────────────────────
    const badgeGfx = this.add.graphics();
    badgeGfx.fillStyle(0x05090f, 0.85);
    badgeGfx.fillRoundedRect(8, 30, GAME_WIDTH - 16, 22, 5);

    this.add.text(16, 38, rank.title.toUpperCase(), {
      fontSize: '9px', color: rank.color, fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0, 0.5);

    this.add.text(GAME_WIDTH / 2, 38, `WAVE ${data.wave}`, {
      fontSize: '9px', color: '#6699bb', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 0.5);

    this.add.text(GAME_WIDTH - 16, 38, diffConfig.label, {
      fontSize: '8px', color: diffColor, fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(1, 0.5);

    // ── Score panel ───────────────────────────────────────────────────────
    const scorePanel = this.add.graphics();
    scorePanel.fillStyle(0x080d18, 0.85);
    scorePanel.fillRoundedRect(20, 56, GAME_WIDTH - 40, 36, 7);
    scorePanel.lineStyle(1, 0x2244aa, 0.7);
    scorePanel.strokeRoundedRect(20, 56, GAME_WIDTH - 40, 36, 7);

    this.add.text(GAME_WIDTH / 2, 63, 'FINAL SCORE', {
      fontSize: '6px', color: '#4466aa', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const scoreDisplay = this.add.text(GAME_WIDTH / 2, 75, '0', {
      fontSize: '15px', color: '#ffee66', fontFamily: 'monospace',
      stroke: '#110800', strokeThickness: 4,
    }).setOrigin(0.5);

    // Count-up animation
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
    cardGfx.fillRoundedRect(10, 98, GAME_WIDTH - 20, 128, 7);
    cardGfx.lineStyle(1, 0x1a2d44, 0.8);
    cardGfx.strokeRoundedRect(10, 98, GAME_WIDTH - 20, 128, 7);

    this.add.text(GAME_WIDTH / 2, 106, '── MISSION REPORT ──', {
      fontSize: '6px', color: '#3355aa', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const rows: [string, string, string][] = [
      ['🛢 OIL TRANSPORTED', `${(data.oilTransported / 1e6).toFixed(1)} Mbbl`, '#55ffcc'],
      ['💧 OIL SPILLED',     `${(data.oilLost / 1e6).toFixed(1)} Mbbl`,        '#ff7733'],
      ['⛽ GULF RESERVES',   `${(data.gulfReserves / 1e6).toFixed(1)} Mbbl`,   '#ffcc44'],
      ['💥 SILOS DESTROYED', `${data.silosDestroyed}`,                          '#77ddff'],
      ['🚢 SHIPS PROTECTED', `${data.shipsProtected}`,                          '#55ffcc'],
      ['☠ SHIPS SUNK',      `${data.shipsSunk}`,                               '#ff6666'],
    ];

    rows.forEach(([label, value, color], i) => {
      const ry = 117 + i * 17;
      if (i % 2 === 0) {
        cardGfx.fillStyle(0xffffff, 0.02);
        cardGfx.fillRect(11, ry - 1, GAME_WIDTH - 22, 17);
      }
      this.add.text(18, ry, label, { fontSize: '6px', color: '#889aaa', fontFamily: 'monospace' });
      this.add.text(GAME_WIDTH - 18, ry, value, {
        fontSize: '7px', color, fontFamily: 'monospace', stroke: '#000', strokeThickness: 2,
      }).setOrigin(1, 0);
    });

    // ── Efficiency bar ────────────────────────────────────────────────────
    const eff      = data.efficiency;
    const effColor = eff >= 75 ? '#44ff88' : eff >= 40 ? '#ffcc00' : '#ff4444';
    const effBarY  = 232;

    this.add.text(GAME_WIDTH / 2, effBarY, `ACCURACY:  ${eff}%`, {
      fontSize: '7px', color: effColor, fontFamily: 'monospace', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);

    const effGfx = this.add.graphics();
    effGfx.fillStyle(0x0a0f18);
    effGfx.fillRoundedRect(20, effBarY + 10, GAME_WIDTH - 40, 7, 3);
    effGfx.fillStyle(eff >= 75 ? 0x22aa44 : eff >= 40 ? 0xcc8800 : 0xcc2200);
    effGfx.fillRoundedRect(20, effBarY + 10, Math.round((GAME_WIDTH - 40) * eff / 100), 7, 3);
    effGfx.lineStyle(1, 0x223344, 0.7);
    effGfx.strokeRoundedRect(20, effBarY + 10, GAME_WIDTH - 40, 7, 3);

    // ── Name entry (if high score) ────────────────────────────────────────
    const nameEntryY = 254;
    if (isHighScore(data.score)) {
      this.buildNameEntry(data, nameEntryY);
    } else {
      this.buildButtons(data, nameEntryY, null);
    }
  }

  private buildNameEntry(data: MissionReport, y: number): void {
    // Prompt card
    const promptGfx = this.add.graphics();
    promptGfx.fillStyle(0x060e1c, 0.92);
    promptGfx.fillRoundedRect(10, y, GAME_WIDTH - 20, 58, 8);
    promptGfx.lineStyle(2, 0x22aa44, 0.85);
    promptGfx.strokeRoundedRect(10, y, GAME_WIDTH - 20, 58, 8);

    this.add.text(GAME_WIDTH / 2, y + 10, '🏆 NEW HIGH SCORE!  ENTER NAME:', {
      fontSize: '7px', color: '#ffee44', fontFamily: 'monospace',
      stroke: '#110800', strokeThickness: 3,
    }).setOrigin(0.5);

    // HTML input overlay for mobile keyboard
    const canvas = this.game.canvas;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = rect.width  / GAME_WIDTH;
    const scaleY = rect.height / GAME_HEIGHT;

    const inp = document.createElement('input');
    inp.type        = 'text';
    inp.maxLength   = 10;
    inp.placeholder = 'YOUR NAME';
    inp.style.cssText = `
      position: fixed;
      left: ${rect.left + 20 * scaleX}px;
      top:  ${rect.top  + (y + 24) * scaleY}px;
      width: ${(GAME_WIDTH - 80) * scaleX}px;
      height: ${22 * scaleY}px;
      font-size: ${12 * Math.min(scaleX, scaleY)}px;
      font-family: monospace;
      background: #0a1828;
      color: #44ff88;
      border: 2px solid #22aa44;
      border-radius: 6px;
      padding: 2px 6px;
      text-align: center;
      text-transform: uppercase;
      outline: none;
      z-index: 1000;
    `;
    document.body.appendChild(inp);
    this.nameInput = inp;
    inp.focus();

    // CONFIRM button
    const btnGfx = this.add.graphics();
    const drawConfirm = (hover: boolean) => {
      btnGfx.clear();
      btnGfx.fillStyle(hover ? 0x1c3a1c : 0x0d2012, 0.95);
      btnGfx.fillRoundedRect(GAME_WIDTH - 78, y + 26, 58, 22, 6);
      btnGfx.lineStyle(2, 0x22aa44, hover ? 0.9 : 0.6);
      btnGfx.strokeRoundedRect(GAME_WIDTH - 78, y + 26, 58, 22, 6);
    };
    drawConfirm(false);
    this.add.text(GAME_WIDTH - 49, y + 37, 'SAVE ▶', {
      fontSize: '8px', color: '#44ff88', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);
    const confirmHit = this.add.rectangle(GAME_WIDTH - 49, y + 37, 58, 22, 0, 0).setInteractive();
    confirmHit.on('pointerover', () => drawConfirm(true));
    confirmHit.on('pointerout',  () => drawConfirm(false));

    const doSave = () => {
      const name = (inp.value.trim() || 'UNKNOWN').substring(0, 10).toUpperCase();
      this.removeNameInput();
      saveScore({
        name,
        score:      data.score,
        wave:       data.wave,
        difficulty: data.difficulty,
        efficiency: data.efficiency,
        date:       new Date().toISOString(),
      });
      this.buildButtons(data, y + 62, name);
    };

    confirmHit.on('pointerdown', () => {
      this.tweens.add({ targets: confirmHit, scaleX: 0.9, scaleY: 0.9, duration: 55, yoyo: true,
        onComplete: doSave });
    });
    inp.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') doSave();
    });
  }

  private buildButtons(data: MissionReport, y: number, _savedName: string | null): void {
    const makeBtn = (label: string, cy: number, baseCol: number, accentCol: number, txtCol: string) => {
      const gfx = this.add.graphics();
      const drawB = (hover: boolean) => {
        gfx.clear();
        gfx.fillStyle(accentCol, hover ? 0.2 : 0.1);
        gfx.fillRoundedRect(GAME_WIDTH / 2 - 92, cy - 15, 184, 30, 9);
        gfx.fillStyle(baseCol, hover ? 0.95 : 0.88);
        gfx.fillRoundedRect(GAME_WIDTH / 2 - 90, cy - 14, 180, 28, 8);
        gfx.fillStyle(0xffffff, 0.06);
        gfx.fillRoundedRect(GAME_WIDTH / 2 - 88, cy - 13, 176, 12, 7);
        gfx.lineStyle(2, accentCol, 0.85);
        gfx.strokeRoundedRect(GAME_WIDTH / 2 - 90, cy - 14, 180, 28, 8);
      };
      drawB(false);
      this.add.text(GAME_WIDTH / 2, cy, label, {
        fontSize: '9px', color: txtCol, fontFamily: 'monospace', stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5);
      const hit = this.add.rectangle(GAME_WIDTH / 2, cy, 180, 28, 0, 0).setInteractive();
      hit.on('pointerover', () => drawB(true));
      hit.on('pointerout',  () => drawB(false));
      return hit;
    };

    const retryBtn = makeBtn('▶  RETRY MISSION', y + 20, 0x0d2a12, 0x33aa44, '#44ff88');
    retryBtn.on('pointerdown', () => {
      this.tweens.add({ targets: retryBtn, scaleX: 0.94, scaleY: 0.94, duration: 60, yoyo: true,
        onComplete: () => this.scene.start('GameScene') });
    });

    // Share score button
    this.buildShareButton(data, y + 56);

    const lbBtn = makeBtn('🏆  LEADERBOARD', y + 88, 0x0e0e06, 0xaaaa22, '#ffee44');
    lbBtn.on('pointerdown', () => {
      this.tweens.add({ targets: lbBtn, scaleX: 0.94, scaleY: 0.94, duration: 60, yoyo: true,
        onComplete: () => this.scene.start('LeaderboardScene') });
    });

    const menuBtn = makeBtn('◀  MAIN MENU', y + 122, 0x0d1228, 0x3366cc, '#88aaff');
    menuBtn.on('pointerdown', () => {
      this.tweens.add({ targets: menuBtn, scaleX: 0.94, scaleY: 0.94, duration: 60, yoyo: true,
        onComplete: () => this.scene.start('MenuScene') });
    });
  }

  private buildShareButton(data: MissionReport, cy: number): void {
    const rank = getRank(data.score);
    const shareText = `🎮 Hormuz Defender — ${rank.title.toUpperCase()} — Score: ${data.score.toLocaleString()} | Wave ${data.wave} | ${data.difficulty.toUpperCase()} difficulty | Accuracy ${data.efficiency}% — play free at https://itch.io`;

    const gfx = this.add.graphics();
    let copied = false;
    const draw = (hover: boolean, done: boolean) => {
      gfx.clear();
      gfx.fillStyle(done ? 0x0e2a0e : (hover ? 0x0e1a2a : 0x060e18), 0.94);
      gfx.fillRoundedRect(GAME_WIDTH / 2 - 92, cy - 14, 184, 28, 8);
      gfx.lineStyle(2, done ? 0x22aa44 : 0x3355aa, hover ? 0.9 : 0.6);
      gfx.strokeRoundedRect(GAME_WIDTH / 2 - 92, cy - 14, 184, 28, 8);
    };
    draw(false, false);

    const label = this.add.text(GAME_WIDTH / 2, cy, '📋  COPY SCORE', {
      fontSize: '9px', color: '#88aaff', fontFamily: 'monospace', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);

    const hit = this.add.rectangle(GAME_WIDTH / 2, cy, 184, 28, 0, 0).setInteractive();
    hit.on('pointerover', () => { if (!copied) draw(true, false); });
    hit.on('pointerout',  () => { if (!copied) draw(false, false); });
    hit.on('pointerdown', () => {
      sounds.playClick();
      const doShare = () => {
        copied = true;
        draw(false, true);
        label.setText('✓  COPIED!').setColor('#44ff88');
      };
      // Try Web Share API first (mobile)
      if (navigator.share) {
        navigator.share({ title: 'Hormuz Defender', text: shareText })
          .then(doShare).catch(() => this.copyToClipboard(shareText, doShare));
      } else {
        this.copyToClipboard(shareText, doShare);
      }
    });
  }

  private copyToClipboard(text: string, onDone: () => void): void {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(onDone).catch(() => {
        // Fallback: create temp textarea
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        onDone();
      });
    }
  }
}

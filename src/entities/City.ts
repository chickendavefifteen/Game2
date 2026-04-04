import Phaser from 'phaser';
import { BALANCE } from '../config/BalanceConfig';
import { EventBus } from '../utils/EventBus';

export class City extends Phaser.GameObjects.Sprite {
  cityId: number;
  cityName: string;
  hp: number;
  maxHp: number;
  oilStorageValue: number;
  isDestroyed = false;

  private nameText: Phaser.GameObjects.Text;
  private hpBar:    Phaser.GameObjects.Graphics;
  private glowGfx:  Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, cityId: number, name: string) {
    super(scene, x, y, 'city', 0);
    this.cityId = cityId;
    this.cityName = name;
    this.maxHp = BALANCE.cities.hitPoints;
    this.hp = this.maxHp;
    this.oilStorageValue = BALANCE.cities.oilStorageValue;

    scene.add.existing(this);
    this.setDepth(3).setOrigin(0.5, 0.5);

    // Ambient city glow (bottom halo)
    this.glowGfx = scene.add.graphics().setDepth(2);
    this.drawGlow('#22aaff', 0.18);

    // City name — bold, stroked, readable on any background
    this.nameText = scene.add.text(x, y - 22, name, {
      fontSize: '7px',
      color: '#ffe88a',
      fontFamily: 'monospace',
      stroke: '#110800',
      strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(20);

    this.hpBar = scene.add.graphics().setDepth(20);
    this.drawHpBar();
  }

  private drawGlow(hex: string, alpha: number): void {
    this.glowGfx.clear();
    this.glowGfx.fillStyle(Phaser.Display.Color.HexStringToColor(hex).color, alpha);
    this.glowGfx.fillEllipse(this.x, this.y + 6, 40, 12);
  }

  takeDamage(): void {
    if (this.isDestroyed) return;
    this.hp = Math.max(0, this.hp - 1);
    this.drawHpBar();

    if (this.hp <= 0) {
      this.setFrame(1);
      this.isDestroyed = true;
      this.drawGlow('#ff4400', 0.28);
      this.nameText.setColor('#ff6644');
      EventBus.emit('cityDestroyed', { cityId: this.cityId });
    } else {
      // Flash red then restore glow
      this.drawGlow('#ff2200', 0.4);
      this.setTint(0xff2200);
      this.scene.time.delayedCall(250, () => {
        if (!this.isDestroyed) {
          this.clearTint();
          const ratio = this.hp / this.maxHp;
          const glowCol = ratio > 0.5 ? '#22aaff' : ratio > 0 ? '#ff8800' : '#ff4400';
          this.drawGlow(glowCol, 0.22);
        }
      });
    }

    EventBus.emit('cityHit', {
      cityId: this.cityId,
      oilStorageValue: this.oilStorageValue,
      hp: this.hp,
    });
  }

  private drawHpBar(): void {
    this.hpBar.clear();
    const bw = 30, bh = 5;
    const bx = this.x - bw / 2;
    const by = this.y + 14;
    const r  = 2;

    // Drop shadow
    this.hpBar.fillStyle(0x000000, 0.5);
    this.hpBar.fillRoundedRect(bx - 1, by + 1, bw + 2, bh + 2, r);
    // Track
    this.hpBar.fillStyle(0x0a0f1a, 0.9);
    this.hpBar.fillRoundedRect(bx, by, bw, bh, r);

    // Segmented pips
    for (let i = 0; i < this.maxHp; i++) {
      const filled = i < this.hp;
      const col = filled
        ? (i === 0 ? 0xdd2200 : i === 1 ? 0xffaa00 : 0x22cc55)
        : 0x111a22;
      const pw = Math.floor(bw / this.maxHp) - 2;
      const px = bx + i * (pw + 2) + 1;
      this.hpBar.fillStyle(col, 1);
      this.hpBar.fillRoundedRect(px, by + 1, pw, bh - 2, 1);
      // gloss on filled pips
      if (filled) {
        this.hpBar.fillStyle(0xffffff, 0.18);
        this.hpBar.fillRect(px, by + 1, pw, Math.floor((bh - 2) / 2));
      }
    }

    // Border
    this.hpBar.lineStyle(1, 0x223344, 0.8);
    this.hpBar.strokeRoundedRect(bx, by, bw, bh, r);
  }

  destroy(fromScene?: boolean): void {
    this.nameText.destroy(fromScene);
    this.hpBar.destroy(fromScene);
    this.glowGfx.destroy(fromScene);
    super.destroy(fromScene);
  }
}


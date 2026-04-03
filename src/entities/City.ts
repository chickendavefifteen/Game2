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

  constructor(scene: Phaser.Scene, x: number, y: number, cityId: number, name: string) {
    super(scene, x, y, 'terrain', 4);
    this.cityId = cityId;
    this.cityName = name;
    this.maxHp = BALANCE.cities.hitPoints;
    this.hp = this.maxHp;
    this.oilStorageValue = BALANCE.cities.oilStorageValue;

    scene.add.existing(this);
    this.setDepth(3).setOrigin(0.5, 0.5);

    // City name label — larger, with stroke for readability
    this.nameText = scene.add.text(x, y - 14, name, {
      fontSize: '6px',
      color: '#ffff99',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(20);

    this.hpBar = scene.add.graphics().setDepth(20);
    this.drawHpBar();
  }

  takeDamage(): void {
    if (this.isDestroyed) return;
    this.hp = Math.max(0, this.hp - 1);
    this.drawHpBar();

    if (this.hp <= 0) {
      this.setFrame(5);
      this.isDestroyed = true;
      EventBus.emit('cityDestroyed', { cityId: this.cityId });
    } else {
      this.setTint(0xff0000);
      this.scene.time.delayedCall(250, () => { if (!this.isDestroyed) this.clearTint(); });
    }

    EventBus.emit('cityHit', {
      cityId: this.cityId,
      oilStorageValue: this.oilStorageValue,
      hp: this.hp,
    });
  }

  private drawHpBar(): void {
    this.hpBar.clear();
    const bw = 24, bh = 4;
    const bx = this.x - bw / 2;
    const by = this.y + 12;

    // Shadow
    this.hpBar.fillStyle(0x000000, 0.6);
    this.hpBar.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    // Track
    this.hpBar.fillStyle(0x333333);
    this.hpBar.fillRect(bx, by, bw, bh);
    // Fill — one pip per HP point for clarity
    for (let i = 0; i < this.maxHp; i++) {
      const filled = i < this.hp;
      const color  = filled ? (i === 0 ? 0xcc2200 : i === 1 ? 0xddaa00 : 0x22aa22) : 0x222222;
      const pw = Math.floor(bw / this.maxHp) - 1;
      this.hpBar.fillStyle(color);
      this.hpBar.fillRect(bx + i * (pw + 1), by, pw, bh);
    }
  }

  destroy(fromScene?: boolean): void {
    this.nameText.destroy(fromScene);
    this.hpBar.destroy(fromScene);
    super.destroy(fromScene);
  }
}

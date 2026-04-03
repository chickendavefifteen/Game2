import Phaser from 'phaser';
import { BALANCE } from '../config/BalanceConfig';
import { EventBus } from '../utils/EventBus';

export class City extends Phaser.GameObjects.Sprite {
  cityId: number;
  cityName: string;
  hp: number;
  maxHp: number;
  oilStorageValue: number;
  isDestroyed: boolean = false;

  private nameText: Phaser.GameObjects.Text;
  private hpBar: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, cityId: number, name: string) {
    super(scene, x, y, 'terrain', 4); // tile 4 = city block
    this.cityId = cityId;
    this.cityName = name;
    this.maxHp = BALANCE.cities.hitPoints;
    this.hp = this.maxHp;
    this.oilStorageValue = BALANCE.cities.oilStorageValue;

    scene.add.existing(this);
    this.setDepth(3);
    this.setOrigin(0.5, 0.5);

    this.nameText = scene.add.text(x, y - 12, name, {
      fontSize: '4px',
      color: '#ffff99',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 1).setDepth(20);

    this.hpBar = scene.add.graphics().setDepth(20);
    this.drawHpBar();
  }

  takeDamage(): void {
    if (this.isDestroyed) return;
    this.hp = Math.max(0, this.hp - 1);
    this.drawHpBar();

    // Show damage frame
    if (this.hp <= 0) {
      this.setFrame(5); // damaged city tile
      this.isDestroyed = true;
      EventBus.emit('cityDestroyed', { cityId: this.cityId });
    } else {
      // Flash red
      this.setTint(0xff0000);
      this.scene.time.delayedCall(200, () => {
        if (!this.isDestroyed) this.clearTint();
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
    const bw = 14;
    const bh = 2;
    const bx = this.x - bw / 2;
    const by = this.y + 10;

    this.hpBar.fillStyle(0x333333);
    this.hpBar.fillRect(bx, by, bw, bh);

    const ratio = this.hp / this.maxHp;
    const color = ratio > 0.6 ? 0x22aa22 : ratio > 0.3 ? 0xddaa00 : 0xcc2200;
    this.hpBar.fillStyle(color);
    this.hpBar.fillRect(bx, by, Math.round(bw * ratio), bh);
  }

  destroy(fromScene?: boolean): void {
    this.nameText.destroy(fromScene);
    this.hpBar.destroy(fromScene);
    super.destroy(fromScene);
  }
}

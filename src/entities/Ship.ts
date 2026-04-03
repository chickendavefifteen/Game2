import Phaser from 'phaser';
import { BALANCE } from '../config/BalanceConfig';
import { GAME_WIDTH } from '../config/GameConfig';
import { EventBus } from '../utils/EventBus';
import { clampToPixel } from '../utils/PixelPerfect';

export class Ship extends Phaser.GameObjects.Sprite {
  shipId: number;
  cargoBarrels: number;
  hp: number;
  isSunk: boolean = false;
  active: boolean = false;

  private speed: number;
  private direction: 1 | -1;  // 1 = left-to-right, -1 = right-to-left
  private laneY: number;
  private animTimer: number = 0;
  private barrelIcon: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, shipId: number) {
    super(scene, 0, 0, 'ship', 0);
    this.shipId = shipId;
    this.hp = BALANCE.ships.hitPoints;
    this.speed = BALANCE.ships.speed;
    this.cargoBarrels = 0;
    this.laneY = 0;
    this.direction = 1;

    scene.physics.add.existing(this);
    scene.add.existing(this);
    this.setVisible(false);
    this.setDepth(4);

    this.barrelIcon = scene.add.text(0, 0, '', {
      fontSize: '4px',
      color: '#ffdd88',
      fontFamily: 'monospace',
    }).setDepth(20).setVisible(false);
  }

  spawn(laneY: number, direction: 1 | -1): void {
    this.active = true;
    this.isSunk = false;
    this.hp = BALANCE.ships.hitPoints;
    this.direction = direction;
    this.laneY = laneY;
    this.cargoBarrels = Phaser.Math.Between(
      BALANCE.ships.cargoBarrelsMin,
      BALANCE.ships.cargoBarrelsMax
    );

    const startX = direction === 1 ? -20 : GAME_WIDTH + 20;
    this.setPosition(startX, laneY);
    this.setVisible(true);
    this.setFlipX(direction === -1);
    this.clearTint();
    this.setFrame(0);

    const barrels = (this.cargoBarrels / 1_000_000).toFixed(1);
    this.barrelIcon.setText(`🛢${barrels}M`);
    this.barrelIcon.setPosition(this.x - 8, this.y - 14);
    this.barrelIcon.setVisible(true);
  }

  update(delta: number): void {
    if (!this.active || this.isSunk) return;

    const dt = delta / 1000;
    const newX = this.x + this.direction * this.speed * dt;
    this.setPosition(Math.round(newX), this.laneY);
    clampToPixel(this);

    // Update barrel label position
    this.barrelIcon.setPosition(this.x - 8, this.y - 14);

    // Animate wake
    this.animTimer += delta;
    if (this.animTimer > 400) {
      this.animTimer = 0;
      this.setFrame(String(this.frame.name) === '0' ? 1 : 0);
    }

    // Check if ship exited the strait
    const exited = (this.direction === 1 && this.x > GAME_WIDTH + 30) ||
                   (this.direction === -1 && this.x < -30);
    if (exited) {
      this.despawn();
      EventBus.emit('shipSafe', { shipId: this.shipId, cargoBarrels: this.cargoBarrels });
    }
  }

  takeDamage(): void {
    if (this.isSunk) return;
    this.hp--;
    if (this.hp <= 0) {
      this.sink();
    } else {
      this.setTint(0xff4400);
      this.scene.time.delayedCall(200, () => {
        if (!this.isSunk) this.clearTint();
      });
    }
  }

  private sink(): void {
    this.isSunk = true;
    this.setTint(0x884422);
    this.barrelIcon.setVisible(false);
    EventBus.emit('shipSunk', {
      shipId: this.shipId,
      cargoBarrels: this.cargoBarrels,
      x: this.x,
      y: this.y,
    });
    this.scene.time.delayedCall(800, () => {
      this.despawn();
    });
  }

  private despawn(): void {
    this.active = false;
    this.setVisible(false);
    this.barrelIcon.setVisible(false);
  }

  get physicsBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  destroy(fromScene?: boolean): void {
    this.barrelIcon.destroy(fromScene);
    super.destroy(fromScene);
  }
}

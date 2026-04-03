import Phaser from 'phaser';
import { BALANCE } from '../config/BalanceConfig';
import { EventBus } from '../utils/EventBus';
import { SiloTimer } from '../ui/SiloTimer';

export type SiloState = 'idle' | 'arming' | 'countingDown' | 'launching' | 'destroyed';

export class Silo extends Phaser.GameObjects.Sprite {
  siloId: number;
  state: SiloState = 'idle';
  maxHp: number;
  hp: number;
  countdownTotal: number = 0;
  countdownRemaining: number = 0;
  targetType: 'ship' | 'city' = 'city';
  targetId: number = -1;
  targetX: number = 0;
  targetY: number = 0;

  timerBar: SiloTimer;
  private armingTimer: number = 0;
  private readonly ARM_DURATION = 1200; // ms

  constructor(scene: Phaser.Scene, x: number, y: number, siloId: number, hitPoints: number) {
    super(scene, Math.round(x), Math.round(y), 'silo', 0);
    this.siloId = siloId;
    this.maxHp = hitPoints;
    this.hp = hitPoints;

    scene.add.existing(this);
    this.setDepth(3);
    this.setOrigin(0.5, 0.5);

    this.timerBar = new SiloTimer(scene, x, y - 14);
    this.timerBar.setVisible(false);
  }

  activate(
    countdownSeconds: number,
    targetType: 'ship' | 'city',
    targetId: number,
    targetX: number,
    targetY: number
  ): void {
    if (this.state !== 'idle') return;

    this.state = 'arming';
    this.countdownTotal = countdownSeconds;
    this.countdownRemaining = countdownSeconds;
    this.targetType = targetType;
    this.targetId = targetId;
    this.targetX = targetX;
    this.targetY = targetY;
    this.armingTimer = 0;

    this.setFrame(1); // opening frame
    this.timerBar.setVisible(true);
    this.timerBar.update(1.0, false);
  }

  update(delta: number): void {
    if (this.state === 'idle' || this.state === 'destroyed') return;

    if (this.state === 'arming') {
      this.armingTimer += delta;
      if (this.armingTimer >= this.ARM_DURATION) {
        this.state = 'countingDown';
        this.setFrame(2); // fully open
      }
      return;
    }

    if (this.state === 'countingDown') {
      this.countdownRemaining -= delta / 1000;

      const ratio = Math.max(0, this.countdownRemaining / this.countdownTotal);
      const warn = this.countdownRemaining <= BALANCE.silo.warningThresholdSeconds;
      this.timerBar.update(ratio, warn);

      if (warn) {
        EventBus.emit('siloWarning', { siloId: this.siloId, timeRemaining: this.countdownRemaining });
      }

      if (this.countdownRemaining <= 0) {
        this.launch();
      }
    }
  }

  hit(): void {
    if (this.state === 'destroyed') return;
    this.hp--;

    if (this.hp <= 0) {
      this.destroySilo();
    } else {
      // Damaged flash
      this.setTint(0xff8800);
      this.scene.time.delayedCall(150, () => {
        if (this.state !== 'destroyed') this.clearTint();
      });
    }
  }

  private launch(): void {
    this.state = 'launching';
    this.timerBar.setVisible(false);

    EventBus.emit('siloLaunched', {
      siloId: this.siloId,
      targetX: this.targetX,
      targetY: this.targetY,
    });

    // After a brief launch delay, reset silo to idle
    this.scene.time.delayedCall(800, () => {
      if (this.state === 'launching') {
        this.state = 'idle';
        this.setFrame(0);
      }
    });
  }

  private destroySilo(): void {
    this.state = 'destroyed';
    this.timerBar.setVisible(false);
    this.setFrame(3);

    // Animate destruction frames
    let frame = 3;
    const tick = () => {
      frame++;
      if (frame <= 5) {
        this.setFrame(frame);
        this.scene.time.delayedCall(120, tick);
      } else {
        this.setVisible(false);
      }
    };
    this.scene.time.delayedCall(120, tick);

    EventBus.emit('siloDestroyed', {
      siloId: this.siloId,
      x: this.x,
      y: this.y,
    });
  }

  resetToIdle(): void {
    this.state = 'idle';
    this.setFrame(0);
    this.setVisible(true);
    this.clearTint();
    this.hp = this.maxHp;
    this.timerBar.setVisible(false);
  }

  destroy(fromScene?: boolean): void {
    this.timerBar.destroy(fromScene);
    super.destroy(fromScene);
  }
}

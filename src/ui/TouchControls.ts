import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';

export interface TouchControlCallbacks {
  onBombButton: () => void;
  onMissileButton: () => void;
}

export class TouchControls {
  private scene: Phaser.Scene;
  private bombBtn: Phaser.GameObjects.Container;
  private missileBtn: Phaser.GameObjects.Container;
  private bombCountText: Phaser.GameObjects.Text;
  private missileCountText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, callbacks: TouchControlCallbacks) {
    this.scene = scene;

    // BOMB button — bottom left
    this.bombBtn = this.makeButton(
      scene, 28, GAME_HEIGHT - 22, 0x334455, '💣', callbacks.onBombButton
    );

    // MISSILE button — bottom right
    this.missileBtn = this.makeButton(
      scene, GAME_WIDTH - 28, GAME_HEIGHT - 22, 0x443344, '🚀', callbacks.onMissileButton
    );

    // Count labels
    this.bombCountText = scene.add.text(28, GAME_HEIGHT - 11, '', {
      fontSize: '4px', color: '#ffdd88', fontFamily: 'monospace'
    }).setOrigin(0.5, 0.5).setDepth(55);

    this.missileCountText = scene.add.text(GAME_WIDTH - 28, GAME_HEIGHT - 11, '', {
      fontSize: '4px', color: '#ffdd88', fontFamily: 'monospace'
    }).setOrigin(0.5, 0.5).setDepth(55);
  }

  private makeButton(
    scene: Phaser.Scene,
    x: number, y: number,
    bgColor: number,
    label: string,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const bg = scene.add.rectangle(0, 0, 28, 18, bgColor, 0.8)
      .setStrokeStyle(1, 0xffffff, 0.5);
    const text = scene.add.text(0, 0, label, {
      fontSize: '8px',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 0.5);

    const container = scene.add.container(x, y, [bg, text]).setDepth(54);
    bg.setInteractive(new Phaser.Geom.Rectangle(-14, -9, 28, 18), Phaser.Geom.Rectangle.Contains);
    bg.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      ptr.event.stopPropagation();
      onClick();
      // Flash feedback
      scene.tweens.add({
        targets: bg,
        alpha: 0.3,
        duration: 80,
        yoyo: true,
      });
    });

    return container;
  }

  updateCounts(bombs: number, missiles: number): void {
    this.bombCountText.setText(`×${bombs}`);
    this.missileCountText.setText(`×${missiles}`);
  }

  destroy(): void {
    this.bombBtn.destroy();
    this.missileBtn.destroy();
    this.bombCountText.destroy();
    this.missileCountText.destroy();
  }
}

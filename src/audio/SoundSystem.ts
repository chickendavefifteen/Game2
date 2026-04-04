/**
 * Procedural sound system using Web Audio API.
 * No audio files — all sounds are synthesised at runtime.
 */

let _instance: SoundSystem | null = null;

export class SoundSystem {
  private ctx: AudioContext | null = null;
  private masterGain!: GainNode;
  private _muted = false;

  static getInstance(): SoundSystem {
    if (!_instance) _instance = new SoundSystem();
    return _instance;
  }

  /** Must be called from a user-gesture handler to unlock AudioContext */
  init(): void {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);
    } catch {
      // Web Audio not available — silent fallback
    }
  }

  get muted(): boolean { return this._muted; }

  toggleMute(): boolean {
    this._muted = !this._muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this._muted ? 0 : 0.5;
    }
    return this._muted;
  }

  private get ac(): AudioContext | null {
    if (!this.ctx || this._muted) return null;
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  private connect(node: AudioNode): void {
    node.connect(this.masterGain!);
  }

  // ── Bomb drop — descending whistle ─────────────────────────────────────
  playBombDrop(): void {
    const ac = this.ac; if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ac.currentTime + 0.5);
    gain.gain.setValueAtTime(0.18, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);
    osc.connect(gain); this.connect(gain);
    osc.start(); osc.stop(ac.currentTime + 0.5);
  }

  // ── Explosion — noise burst ────────────────────────────────────────────
  playExplosion(size: 'small' | 'large' = 'large'): void {
    const ac = this.ac; if (!ac) return;
    const dur = size === 'large' ? 0.55 : 0.25;
    const buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const src  = ac.createBufferSource();
    const flt  = ac.createBiquadFilter();
    const gain = ac.createGain();
    src.buffer = buf;
    flt.type   = 'lowpass';
    flt.frequency.value = size === 'large' ? 440 : 800;
    gain.gain.setValueAtTime(size === 'large' ? 0.6 : 0.3, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    src.connect(flt); flt.connect(gain); this.connect(gain);
    src.start(); src.stop(ac.currentTime + dur);
  }

  // ── Player missile fire — rising whoosh ───────────────────────────────
  playMissileFire(): void {
    const ac = this.ac; if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ac.currentTime + 0.18);
    gain.gain.setValueAtTime(0.15, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.22);
    osc.connect(gain); this.connect(gain);
    osc.start(); osc.stop(ac.currentTime + 0.22);
  }

  // ── Enemy missile incoming — alarm pulse ──────────────────────────────
  playMissileIncoming(): void {
    const ac = this.ac; if (!ac) return;
    for (let i = 0; i < 2; i++) {
      const t   = ac.currentTime + i * 0.14;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'square';
      osc.frequency.value = 1100 + i * 100;
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain); this.connect(gain);
      osc.start(t); osc.stop(t + 0.1);
    }
  }

  // ── Silo warning beep ─────────────────────────────────────────────────
  playSiloWarning(): void {
    const ac = this.ac; if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.12, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08);
    osc.connect(gain); this.connect(gain);
    osc.start(); osc.stop(ac.currentTime + 0.08);
  }

  // ── Ship sunk — low boom ──────────────────────────────────────────────
  playShipSunk(): void {
    const ac = this.ac; if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ac.currentTime + 0.6);
    gain.gain.setValueAtTime(0.4, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.6);
    osc.connect(gain); this.connect(gain);
    osc.start(); osc.stop(ac.currentTime + 0.6);
    this.playExplosion('small');
  }

  // ── Wave clear fanfare — ascending arpeggio ───────────────────────────
  playWaveClear(): void {
    const ac = this.ac; if (!ac) return;
    const freqs = [523, 659, 784, 1047]; // C5 E5 G5 C6
    freqs.forEach((f, i) => {
      const t    = ac.currentTime + i * 0.12;
      const osc  = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain); this.connect(gain);
      osc.start(t); osc.stop(t + 0.3);
    });
  }

  // ── Victory fanfare — full chord + flourish ───────────────────────────
  playVictory(): void {
    const ac = this.ac; if (!ac) return;
    // Triumphant ascending sweep
    const melody = [523, 659, 784, 1047, 1319, 1047, 784, 1047];
    melody.forEach((f, i) => {
      const t    = ac.currentTime + i * 0.1;
      const osc  = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain); this.connect(gain);
      osc.start(t); osc.stop(t + 0.25);
    });
  }

  // ── UI click ──────────────────────────────────────────────────────────
  playClick(): void {
    const ac = this.ac; if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ac.currentTime + 0.04);
    gain.gain.setValueAtTime(0.1, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.04);
    osc.connect(gain); this.connect(gain);
    osc.start(); osc.stop(ac.currentTime + 0.04);
  }

  // ── City hit — low thud ───────────────────────────────────────────────
  playCityHit(): void {
    const ac = this.ac; if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ac.currentTime + 0.4);
    gain.gain.setValueAtTime(0.35, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4);
    osc.connect(gain); this.connect(gain);
    osc.start(); osc.stop(ac.currentTime + 0.4);
  }

  // ── Silo destroyed — punchy boom ─────────────────────────────────────
  playSiloDestroyed(): void {
    this.playExplosion('large');
    const ac = this.ac; if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, ac.currentTime + 0.02);
    osc.frequency.exponentialRampToValueAtTime(60, ac.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, ac.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
    osc.connect(gain); this.connect(gain);
    osc.start(ac.currentTime + 0.02);
    osc.stop(ac.currentTime + 0.3);
  }
}

export const sounds = SoundSystem.getInstance();

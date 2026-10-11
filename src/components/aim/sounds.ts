// ══════════════════════════════════════════════════════
// SGS AIM — Pro Sound Engine (Multi-Couches, Zéro Latence)
// ══════════════════════════════════════════════════════

export type HitSoundProfile = "valorant" | "bell" | "pop" | "wood";

class AimAudioEngine {
  private ctx: AudioContext | null = null;
  private currentProfile: HitSoundProfile = "valorant";

  public setSoundProfile(p: HitSoundProfile) {
    this.currentProfile = p;
  }

  public getSoundProfile(): HitSoundProfile {
    return this.currentProfile;
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Spatialisation audio 3D (Idée 43) : Son de pas ou d'alerte positionné à gauche/droite (-1 à +1)
   */
  playSpatialPing(pan: number = 0) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    if (ctx.createStereoPanner) {
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), now);
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(ctx.destination);
    } else {
      osc.connect(gain);
      gain.connect(ctx.destination);
    }

    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Tir d'arme de poing / Vandal punchy
   * Double couche : Clac transitoire aigu + corps basse fréquence percutant
   */
  playShoot() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Transient Click (Le "clac" de la culasse)
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = "triangle";
    clickOsc.frequency.setValueAtTime(3200, now);
    clickOsc.frequency.exponentialRampToValueAtTime(300, now + 0.035);
    clickGain.gain.setValueAtTime(0.4, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.035);

    // 2. Punch basse fréquence (Le recul et la détonation)
    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thudOsc.type = "sine";
    thudOsc.frequency.setValueAtTime(140, now);
    thudOsc.frequency.exponentialRampToValueAtTime(45, now + 0.09);
    thudGain.gain.setValueAtTime(0.35, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    thudOsc.connect(thudGain);
    thudGain.connect(ctx.destination);
    thudOsc.start(now);
    thudOsc.stop(now + 0.09);
  }

  /**
   * Impact sur le corps (Hitsounds personnalisables selon le profil - Idée 58)
   */
  playHit() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (this.currentProfile === "bell") {
      // Cloche aiguë claire
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1760, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
      return;
    }

    if (this.currentProfile === "pop") {
      // Pop étouffé doux
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.04);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
      return;
    }

    if (this.currentProfile === "wood") {
      // Clic sec mécanique
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
      return;
    }

    // Défaut : Valorant hitmarker
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(980, now);
    osc.frequency.exponentialRampToValueAtTime(1450, now + 0.05);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Headshot "DINK" légendaire (Cloche métallique double harmonique haute)
   */
  playHeadshot() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Harmonique 1 : Cloche métallique brillante (2100Hz)
    const bell1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    bell1.type = "sine";
    bell1.frequency.setValueAtTime(2100, now);
    bell1.frequency.exponentialRampToValueAtTime(2600, now + 0.16);
    gain1.gain.setValueAtTime(0.45, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    bell1.connect(gain1);
    gain1.connect(ctx.destination);
    bell1.start(now);
    bell1.stop(now + 0.18);

    // Harmonique 2 : Dissonance brillante métallique (3350Hz)
    const bell2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    bell2.type = "triangle";
    bell2.frequency.setValueAtTime(3350, now);
    bell2.frequency.exponentialRampToValueAtTime(1800, now + 0.14);
    gain2.gain.setValueAtTime(0.28, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    bell2.connect(gain2);
    gain2.connect(ctx.destination);
    bell2.start(now);
    bell2.stop(now + 0.16);

    // Bruit de craquement d'armure / shatter
    const crackOsc = ctx.createOscillator();
    const crackGain = ctx.createGain();
    crackOsc.type = "sawtooth";
    crackOsc.frequency.setValueAtTime(900, now);
    crackOsc.frequency.exponentialRampToValueAtTime(120, now + 0.04);
    crackGain.gain.setValueAtTime(0.2, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    crackOsc.connect(crackGain);
    crackGain.connect(ctx.destination);
    crackOsc.start(now);
    crackOsc.stop(now + 0.04);
  }

  /**
   * Tir raté : sifflement discret d'air
   */
  playMiss() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.05);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Impulsion de saut (Parkour / Runner)
   */
  playJump() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.1);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Atterrissage sur plateforme
   */
  playLand() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.08);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  playCountdownTick() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(600, now);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  playCountdownGo() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(1700, now + 0.22);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  playFinish() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.07;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.16);
    });
  }
}

export const aimSounds = new AimAudioEngine();

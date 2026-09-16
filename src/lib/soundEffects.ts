// Native Web Audio UI Sound Synthesizer (Zero asset download required)

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.08; // Default subtle volume

  constructor() {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("spycam_sound_enabled");
      if (stored !== null) {
        this.enabled = stored === "true";
      }
      const storedVol = localStorage.getItem("spycam_sound_volume");
      if (storedVol !== null) {
        const parsed = parseFloat(storedVol);
        if (!isNaN(parsed)) this.volume = Math.max(0, Math.min(1, parsed));
      }

      // Unlock AudioContext on first user interaction
      const unlockAudio = () => {
        this.initCtx();
        window.removeEventListener("click", unlockAudio);
        window.removeEventListener("keydown", unlockAudio);
        window.removeEventListener("touchstart", unlockAudio);
      };
      window.addEventListener("click", unlockAudio, { once: true });
      window.addEventListener("keydown", unlockAudio, { once: true });
      window.addEventListener("touchstart", unlockAudio, { once: true });
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (typeof window !== "undefined") {
      localStorage.setItem("spycam_sound_enabled", String(val));
    }
  }

  public isEnabled() {
    return this.enabled;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (typeof window !== "undefined") {
      localStorage.setItem("spycam_sound_volume", String(this.volume));
    }
  }

  public getVolume() {
    return this.volume;
  }

  // 1. Ultra-subtle hover sound for buttons & items
  public playHover() {
    if (!this.enabled || this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.015);

      gain.gain.setValueAtTime(this.volume * 0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.018);
    } catch {}
  }

  // 2. Soft micro-click for typing in search bar
  public playTyping() {
    if (!this.enabled || this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1400 + Math.random() * 200, now);

      gain.gain.setValueAtTime(this.volume * 0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.015);
    } catch {}
  }

  // 3. Feather-light, smooth warm tone for general tab / menu navigation
  public playTabSwitch() {
    if (!this.enabled || this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.04);

      gain.gain.setValueAtTime(this.volume * 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }

  // 4. Clean futuristic tactile click for standard buttons
  public playClick() {
    if (!this.enabled || this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.03);

      gain.gain.setValueAtTime(this.volume * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  // 5. Soft noise breeze / souffle for Privacy toggle buttons ("Ce que voient les autres visiteurs")
  public playBreeze() {
    if (!this.enabled || this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.06; // 60ms noise
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1600, now);
      filter.frequency.exponentialRampToValueAtTime(800, now + 0.05);
      filter.Q.value = 2;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(this.volume * 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.06);
    } catch {}
  }

  // 6. Grid Widget Pick up / Grab sound (taking an object)
  public playGrabWidget() {
    if (!this.enabled || this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.025);

      gain.gain.setValueAtTime(this.volume * 0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch {}
  }

  // 7. Grid Widget Step / Cell Snap sound (moving an object across cells)
  public playDragStep() {
    if (!this.enabled || this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.015);

      gain.gain.setValueAtTime(this.volume * 0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.016);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.02);
    } catch {}
  }

  // 8. Grid Widget Resize Step sound (dimension expanding/shrinking)
  public playResizeStep() {
    if (!this.enabled || this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.018);

      gain.gain.setValueAtTime(this.volume * 0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.022);
    } catch {}
  }

  // 9. Grid Widget Snap / Drop sound (dropping/releasing an object)
  public playDropWidget() {
    if (!this.enabled || this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.05);

      gain.gain.setValueAtTime(this.volume * 0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.065);
    } catch {}
  }

  // 10. Weapon hitmap modal open slide sound
  public playWeaponModal() {
    if (!this.enabled || this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.06);

      gain.gain.setValueAtTime(this.volume * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.075);
    } catch {}
  }

  // 11. Cancel / Reset / Close sound (gentle descending chime)
  public playCancel() {
    if (!this.enabled || this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.06);

      gain.gain.setValueAtTime(this.volume * 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {}
  }

  // 12. Satisfying cybernetic lock-in / save chime (the user's favorite)
  public playLockIn() {
    if (!this.enabled || this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [440, 660, 880].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const startTime = now + idx * 0.035;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(this.volume * 0.5, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.13);
      });
    } catch {}
  }

  // 13. Discord-style Voice Channel Connected Sound (Rising harmonious chord)
  public playVoiceJoin() {
    if (!this.enabled || this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Tone 1: 440 Hz (A4)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(440, now);
      gain1.gain.setValueAtTime(this.volume * 0.45, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.13);

      // Tone 2: 659.25 Hz (E5)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(659.25, now + 0.075);
      gain2.gain.setValueAtTime(this.volume * 0.5, now + 0.075);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.075);
      osc2.stop(now + 0.23);

      // Tone 3: 880 Hz (A5 - resolving bright chord)
      const osc3 = this.ctx.createOscillator();
      const gain3 = this.ctx.createGain();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(880, now + 0.15);
      gain3.gain.setValueAtTime(this.volume * 0.55, now + 0.15);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
      osc3.connect(gain3);
      gain3.connect(this.ctx.destination);
      osc3.start(now + 0.15);
      osc3.stop(now + 0.39);
    } catch {}
  }

  // 14. Discord-style Voice Channel Disconnected Sound (Descending warm chime)
  public playVoiceLeave() {
    if (!this.enabled || this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Tone 1: 659.25 Hz (E5)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(this.volume * 0.45, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      // Tone 2: 440 Hz (A4)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(440, now + 0.07);
      gain2.gain.setValueAtTime(this.volume * 0.48, now + 0.07);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.20);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.07);
      osc2.stop(now + 0.21);

      // Tone 3: 329.63 Hz (E4 - resolving warm base note)
      const osc3 = this.ctx.createOscillator();
      const gain3 = this.ctx.createGain();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(329.63, now + 0.14);
      gain3.gain.setValueAtTime(this.volume * 0.42, now + 0.14);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc3.connect(gain3);
      gain3.connect(this.ctx.destination);
      osc3.start(now + 0.14);
      osc3.stop(now + 0.36);
    } catch {}
  }

  // 15. Mic Mute toggle sound
  public playVoiceMute() {
    if (!this.enabled || this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.07);
      gain.gain.setValueAtTime(this.volume * 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.085);
    } catch {}
  }

  // 16. Mic Unmute toggle sound
  public playVoiceUnmute() {
    if (!this.enabled || this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.07);
      gain.gain.setValueAtTime(this.volume * 0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.085);
    } catch {}
  }

  // 17. Level Up celebratory chime sound
  public playLevelUp() {
    if (!this.enabled || this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Arpeggio: C5, E5, G5, C6 with warm tone
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(this.volume * 0.5, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.32);
      });
    } catch {}
  }
}

export const sounds = new SoundEngine();

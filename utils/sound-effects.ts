
/**
 * Generates synthetic sound effects for the EcoScan UI using Web Audio API.
 */

class SoundService {
  private ctx: AudioContext | null = null;

  private getCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.ctx;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1, slideTo?: number) {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
    }

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  playSuccess() {
    // Upward high-tech chime
    this.playTone(660, 'sine', 0.2, 0.1, 1320);
  }

  playError() {
    // Low dissonant thud
    this.playTone(150, 'sawtooth', 0.4, 0.1, 50);
  }

  playRecycle() {
    // Metallic "ting"
    this.playTone(1760, 'sine', 0.3, 0.1);
    setTimeout(() => this.playTone(2200, 'sine', 0.1, 0.05), 50);
  }

  playOrganic() {
    // Soft woody pop
    this.playTone(440, 'triangle', 0.2, 0.1, 220);
  }

  playTrash() {
    // Neutral mid-tone beep
    this.playTone(330, 'square', 0.15, 0.05);
  }

  playSpecial() {
    // Sharp alert for Hazardous/Electronic/Textile
    this.playTone(880, 'square', 0.1, 0.1);
    setTimeout(() => this.playTone(880, 'square', 0.1, 0.1), 150);
  }

  playConnected() {
    // System boot sound
    this.playTone(440, 'sine', 0.1, 0.1);
    setTimeout(() => this.playTone(554.37, 'sine', 0.1, 0.1), 100);
    setTimeout(() => this.playTone(659.25, 'sine', 0.3, 0.1), 200);
  }

  // --- Spatial Feedback Sounds ---

  playMoveCloser() {
    // Two low pulses
    this.playTone(200, 'sine', 0.1, 0.08);
    setTimeout(() => this.playTone(180, 'sine', 0.15, 0.08), 150);
  }

  playMoveBack() {
    // High-pitched double beep
    this.playTone(1200, 'sine', 0.05, 0.05);
    setTimeout(() => this.playTone(1200, 'sine', 0.05, 0.05), 100);
  }

  playHoldSteady() {
    // Calm, mid-range focus "blip"
    this.playTone(440, 'sine', 0.15, 0.05, 440);
  }

  playShutter() {
    // Sharp, fast shutter sound
    this.playTone(2000, 'square', 0.05, 0.1);
  }
}

export const sounds = new SoundService();

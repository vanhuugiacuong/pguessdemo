import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  private audioCtx: AudioContext | null = null;
  private _isMuted = new BehaviorSubject<boolean>(false);
  public isMuted$ = this._isMuted.asObservable();

  // Throttle draw stroke sound to avoid spam
  private lastStrokeSound = 0;
  private readonly STROKE_THROTTLE_MS = 150;

  public get isMuted(): boolean {
    return this._isMuted.value;
  }

  public setMuted(muted: boolean): void {
    this._isMuted.next(muted);
  }

  public toggleMute(): void {
    this._isMuted.next(!this._isMuted.value);
  }

  /** Lazy-init AudioContext on first user interaction */
  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      try {
        this.audioCtx = new AudioContext();
      } catch (e) {
        console.warn('AudioContext not supported:', e);
        return null;
      }
    }
    // Resume if suspended (browser policy requires user gesture)
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Core helper: play a note at a given frequency for a given duration.
   */
  private playNote(
    frequency: number,
    duration: number,
    startTime: number,
    volume = 0.3,
    type: OscillatorType = 'sine',
    fadeOut = true
  ): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);

    gainNode.gain.setValueAtTime(volume, startTime);
    if (fadeOut) {
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    }

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  /**
   * Play a noise burst (for scratch / draw sound).
   */
  private playNoise(duration: number, volume = 0.05): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Filter to make it sound like a soft scratch
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3000;
    filter.Q.value = 0.5;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(ctx.currentTime);
    source.stop(ctx.currentTime + duration);
  }

  // ------------------------------------------------------------------
  // Public sound methods
  // ------------------------------------------------------------------

  /** Jingle khi đoán đúng từ khóa: 4 nốt hợp âm lên cao */
  public playCorrectGuess(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      this.playNote(freq, 0.25, t + i * 0.1, 0.25, 'sine');
    });
    // Thêm harmony nhẹ
    this.playNote(659.25, 0.5, t, 0.08, 'triangle');
  }

  /** Âm buồn khi hết giờ */
  public playWrong(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    this.playNote(392, 0.2, t, 0.3, 'sawtooth');
    this.playNote(349, 0.3, t + 0.15, 0.3, 'sawtooth');
    this.playNote(293, 0.5, t + 0.3, 0.3, 'sawtooth');
  }

  /** Jingle bắt đầu game: vui nhộn */
  public playGameStart(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const melody: { freq: number; dur: number }[] = [
      { freq: 523.25, dur: 0.15 },  // C5
      { freq: 659.25, dur: 0.15 },  // E5
      { freq: 783.99, dur: 0.15 },  // G5
      { freq: 1046.50, dur: 0.35 }, // C6
    ];
    melody.forEach((note, i) => {
      this.playNote(note.freq, note.dur, t + i * 0.13, 0.3, 'triangle');
    });
    // Bass thêm chiều sâu
    this.playNote(261.63, 0.5, t, 0.12, 'sine');
  }

  /** Whoosh nhẹ khi bắt đầu vòng mới */
  public playRoundStart(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(200, t);
    oscillator.frequency.exponentialRampToValueAtTime(600, t + 0.3);

    gainNode.gain.setValueAtTime(0.2, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    oscillator.start(t);
    oscillator.stop(t + 0.3);
  }

  /** Tick mỗi giây khi đếm ngược cảnh báo (≤10s) */
  public playTimerTick(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    this.playNote(880, 0.05, t, 0.15, 'square', true);
  }

  /** Jingle chiến thắng cuối game */
  public playGameOver(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const fanfare: { freq: number; dur: number; delay: number }[] = [
      { freq: 523.25, dur: 0.12, delay: 0 },
      { freq: 523.25, dur: 0.12, delay: 0.12 },
      { freq: 523.25, dur: 0.12, delay: 0.24 },
      { freq: 415.30, dur: 0.30, delay: 0.36 },
      { freq: 466.16, dur: 0.10, delay: 0.66 },
      { freq: 523.25, dur: 0.40, delay: 0.76 },
      { freq: 466.16, dur: 0.10, delay: 1.16 },
      { freq: 523.25, dur: 0.60, delay: 1.26 },
    ];
    fanfare.forEach(({ freq, dur, delay }) => {
      this.playNote(freq, dur, t + delay, 0.25, 'triangle');
      this.playNote(freq * 1.26, dur, t + delay, 0.08, 'sine');
    });
  }

  /** Pop nhẹ khi người dùng join phòng */
  public playJoin(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    this.playNote(880, 0.07, t, 0.2, 'sine', true);
    this.playNote(1046.5, 0.1, t + 0.06, 0.15, 'sine', true);
  }

  /** Soft scratch khi bắt đầu nét vẽ (throttled) */
  public playDrawStroke(): void {
    if (this.isMuted) return;
    const now = Date.now();
    if (now - this.lastStrokeSound < this.STROKE_THROTTLE_MS) return;
    this.lastStrokeSound = now;
    this.playNoise(0.08, 0.04);
  }
}

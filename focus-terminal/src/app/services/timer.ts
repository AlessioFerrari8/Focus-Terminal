import { Injectable, signal, WritableSignal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Timer {
  // seconds left
  remaining: WritableSignal<number> = signal<number>(0);
  isRunning: WritableSignal<boolean> = signal<boolean>(false);
  private interval: ReturnType<typeof setInterval> | null = null;

  start(minutes: number) {
    this.remaining.set(minutes * 60);
    this.isRunning.set(true);
    this.interval = setInterval(() => {
      this.remaining.update(old => {
        if (old <= 1) {
          this.stop();
          return 0;
        }
        return old - 1;
      });
    }, 1000);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    // stoppo la flag
    this.isRunning.set(false);
  }

  format(): string {
    // per i minuti, uso pad se 0
    const m = Math.floor(this.remaining() / 60).toString().padStart(2, '0');
    // stessa cosa con i secondi
    const s = (this.remaining() % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

}

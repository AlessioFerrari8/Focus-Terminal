import { Injectable, signal, WritableSignal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Timer {
  // seconds left
  remaining: WritableSignal<number> = signal<number>(0);
  isRunning: WritableSignal<boolean> = signal<boolean>(false);
  private interval: ReturnType<typeof setInterval> | null = null;
  private _startedMinutes = 0;

  // sessioni
  sessions = signal<{ duration: number; completedAt: Date }[]>([]);

  completeSession(duration: number) {
    this.sessions.update(old => [...old, { duration, completedAt: new Date() }]);
  }

  /**
   * metodo per far partire il tempo 
   * @param minutes 
   */
  start(minutes: number) {
    this._startedMinutes = minutes;
    // aggiorno i vari signal
    this.remaining.set(minutes * 60);
    this.isRunning.set(true);
    this.interval = setInterval(() => {
      this.remaining.update(old => {
        if (old <= 1) {
          this.stop(true);
          return 0;
        }
        return old - 1;
      });
    }, 1000);
  }

  stop(completed = false) {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (completed) this.completeSession(this._startedMinutes);
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

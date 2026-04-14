import { effect, inject, Injectable, signal, WritableSignal } from '@angular/core';
import { FirestoreSync } from './firestore-sync';

@Injectable({
  providedIn: 'root',
})
export class Timer {
  // seconds left
  remaining: WritableSignal<number> = signal<number>(0);
  isRunning: WritableSignal<boolean> = signal<boolean>(false);
  private interval: ReturnType<typeof setInterval> | null = null;
  private _startedMinutes = 0;
  sessionCompleted = signal<boolean>(false);

  // Pomodoro
  pomodoroMode: WritableSignal<boolean> = signal<boolean>(false);
  pomodoroRound: WritableSignal<number> = signal<number>(0);
  isBreak: WritableSignal<boolean> = signal<boolean>(false);

  // tempi
  private readonly WORK_MINUTES = 25;
  private readonly BREAK_MINUTES = 5;

  
  private firebaseSync = inject(FirestoreSync);
  // sessioni
  sessions = signal<any[]>([]);

  constructor() {
    // Sincronizza le sessioni quando cambiano
    effect(() => {
      this.firebaseSync.saveSessions(this.sessions());
    });
  }

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

  startPomodoro() {
    // aggiorno i 2 signal e faccio partire normalmente
    this.pomodoroMode.set(true);
    this.isBreak.set(false);
    this.start(this.WORK_MINUTES);
  }

  stop(completed = false) {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (completed) {
      this.completeSession(this._startedMinutes);
      // metto a true 
      this.sessionCompleted.set(true);
      // rimetto subito a false
      setTimeout(() => this.sessionCompleted.set(false), 100) 
      // se sono in pomodoro
      if (this.pomodoroMode()) {
        if (this.isBreak()) {
          // pausa?
          this.isBreak.set(false);
          // faccio partire il tempo di lavoro
          setTimeout(() => this.start(this.WORK_MINUTES), 500)
        } else {
          // lavoro?
          this.pomodoroRound.update(old => old + 1);
          this.isBreak.set(true)
          // faccio partire il tempo di pausa
          setTimeout(() => this.start(this.BREAK_MINUTES), 500)
        }
      }
    } 
    // stoppo la flag
    this.isRunning.set(false);
  }

  stopPomodoro() {
    this.stop();
    this.pomodoroMode.set(false);
  }

  format(): string {
    // per i minuti, uso pad se 0
    const m = Math.floor(this.remaining() / 60).toString().padStart(2, '0');
    // stessa cosa con i secondi
    const s = (this.remaining() % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

}

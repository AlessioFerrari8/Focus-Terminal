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

  // settings
  settings: WritableSignal<{ workMinutes: number; breakMinutes: number }> = signal({
    workMinutes: 25,
    breakMinutes: 5,
  });

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
    this.start(this.settings().workMinutes);
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
          setTimeout(() => this.start(this.settings().workMinutes), 500)
        } else {
          // lavoro?
          this.pomodoroRound.update(old => old + 1);
          this.isBreak.set(true)
          // faccio partire il tempo di pausa
          setTimeout(() => this.start(this.settings().breakMinutes), 500)
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

  // calcolo le statistiche
  calculateStats() {
    // ritorno sessioni, divise per data, settimana 
    const sessions = this.sessions();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    // Totale
    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalSessionsCount = sessions.length;
    const averageDuration = totalSessionsCount > 0 ? Math.round(totalMinutes / totalSessionsCount) : 0;

    // Oggi
    const todaySessions = sessions.filter(s => {
      const sessionDate = new Date(s.completedAt);
      return sessionDate >= today;
    }).length;
    const todayMinutes = sessions
      .filter(s => new Date(s.completedAt) >= today)
      .reduce((sum, s) => sum + s.duration, 0);

    // Questa settimana
    const weekSessions = sessions.filter(s => {
      const sessionDate = new Date(s.completedAt);
      return sessionDate >= weekAgo;
    }).length;
    const weekMinutes = sessions
      .filter(s => new Date(s.completedAt) >= weekAgo)
      .reduce((sum, s) => sum + s.duration, 0);

    // Streak
    const currentStreak = this.calculateCurrentStreak(sessions);
    const bestStreak = this.calculateBestStreak(sessions);

    // By day (ultimi 7 giorni)
    const byDay = this.getStatsByDay(sessions, 7);

    // ritorno l'oggetto
    return {
      totalSessions: totalSessionsCount,
      totalMinutes,
      averageDuration,
      todaySessions,
      todayMinutes,
      weekSessions,
      weekMinutes,
      currentStreak,
      bestStreak,
      byDay
    };
  }

  // streak attuale
  private calculateCurrentStreak(sessions: any[]): number {
    if (sessions.length === 0) return 0;

    // data
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let streak = 0;

    // ciclo per ogni giorno
    for (let i = 0; i < 365; i++) {
      // controllo la data
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dayStr = checkDate.toDateString();

      // se ha la sessione lo aggiungo
      const hasSessionOnDay = sessions.some(s => 
        new Date(s.completedAt).toDateString() === dayStr
      );

      // aggiorno la streak
      if (hasSessionOnDay) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }

  // calcolo la streak migliore
  private calculateBestStreak(sessions: any[]): number {
    if (sessions.length === 0) return 0;

    // variabili iniziali con sessioni come prima
    let maxStreak = 0;
    let currentStreak = 0;
    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    );

    // data
    let lastDate: Date | null = null;

    // ciclo tutte le sessioni
    for (const session of sortedSessions) {
      const sessionDate = new Date(session.completedAt);
      const sessionDateStr = sessionDate.toDateString();

      // calcolo
      if (!lastDate) {
        currentStreak = 1;
        lastDate = sessionDate;
      } else {
        const lastDateStr = new Date(lastDate).toDateString();
        const daysDiff = Math.floor(
          (sessionDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // in base alla differenza, aggiorno le variabili sopra
        if (daysDiff === 0) {
          continue;
        } else if (daysDiff === 1) {
          currentStreak++;
          lastDate = sessionDate;
        } else {
          maxStreak = Math.max(maxStreak, currentStreak);
          currentStreak = 1;
          lastDate = sessionDate;
        }
      }
    }

    // se la current è maggiore della max aggiorno (evito altri controli)
    maxStreak = Math.max(maxStreak, currentStreak);
    return maxStreak;
  }

  // stats per ogni singolo giorno
  private getStatsByDay(sessions: any[], days: number) {
    // mi creo i giorni della settimana + un record
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const byDay: Record<string, { sessions: number; minutes: number }> = {};

    // scorro per ogni giorno
    for (let i = 0; i < days; i++) {
      // data
      const date = new Date();
      date.setDate(date.getDate() - i);
      // aggiorno con ogni giorno
      const dayName = daysOfWeek[date.getDay()];
      if (!byDay[dayName]) {
        byDay[dayName] = { sessions: 0, minutes: 0 };
      }
    }

    // per ogni sessione
    sessions.forEach(s => {
      // data
      const sessionDate = new Date(s.completedAt);
      const now = new Date();
      // diff girorni
      const daysDiff = Math.floor(
        (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // aggiorno le variabili
      if (daysDiff < days) {
        const dayName = daysOfWeek[sessionDate.getDay()];
        byDay[dayName].sessions++;
        byDay[dayName].minutes += s.duration;
      }
    });

    return byDay;
  }

  getDayOfWeek() {
    // prendo data, e calcolo quella di oggi
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // calcolo giorno 1 settimana fa
    const weekAgo = new Date(today)
    weekAgo.setDate(today.getDate() - 7);


    // filtro per sessioni dentro questo lasso di tempo
    const weekSessions = this.sessions().filter(s => {
      const sessionDate = new Date(s.completedAt);
      // dalla data di 7 giorni fa in avanti
      return sessionDate >= weekAgo;
    })

    // raggruppo per giorno della settimana
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const statsByDay: Record<string, { minutes: number; sessions: number }> = {};

    // inizializzo i 7 giorni
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      // prendo solo il nome per confrontarlo
      const dayName = daysOfWeek[d.getDay()]
      if (!statsByDay[dayName]) {
        // inziializzo
        statsByDay[dayName] = { minutes: 0, sessions: 0 };
      }
    }

    // Aggiungi le sessioni al giorno corretto
    weekSessions.forEach(s => {
      const sDate = new Date(s.completedAt);
      const dayName = daysOfWeek[sDate.getDay()];
      if (statsByDay[dayName]) {
        statsByDay[dayName].minutes += s.duration;
        statsByDay[dayName].sessions++;
      }
    });

    return statsByDay;
  }

  getBarChart(): string[] {
    // calcolo le stats e preparo l'output
    const stats = this.getDayOfWeek();
    const output: string[] = [
      '━━━━━━━━━━━━━━━━━━━━━━',
      '      THIS WEEK',
      '━━━━━━━━━━━━━━━━━━━━━━'
    ];

    // Calcola il massimo per normalizzare la barra
    const maxMinutes = Math.max(
      ...Object.values(stats).map(s => s.minutes),
      1
    );

    // Ordine fisso della settimana
    const orderDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let totalMinutes = 0, totalSessions = 0;

    // ciclo per riempire
    orderDays.forEach(day => {
      const dayStats = stats[day];
      if (dayStats) {
        totalMinutes += dayStats.minutes;
        totalSessions += dayStats.sessions;
        
        const { minutes, sessions } = dayStats;
        // Barra: scala da 0 a 10 blocchi
        const barCount = Math.round((minutes / maxMinutes) * 10);
        const bar = '█'.repeat(barCount);
        
        // Formato durata
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const duration = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
        
        // aggiungo
        output.push(`  ${day}: ${duration} (${sessions} sessions)   ${bar}`);
      }
    });

    // finale
    output.push('━━━━━━━━━━━━━━━━━━━━━━');
    output.push(`  Total: ${totalMinutes}min (${totalSessions} sessions)`);
    
    return output;
  }

}

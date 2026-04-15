import {
  Component, computed, signal, WritableSignal,
  ElementRef, ViewChild, AfterViewChecked,
  inject,
  OnInit,
  effect,
  HostListener,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Timer } from './services/timer';
import { CommandParser } from './services/command-parser';
import { HttpClient } from '@angular/common/http';
import { NgClass } from '@angular/common';
import { Todo } from './services/todo';
import { Audio } from './services/audio';
import { FirestoreSync } from './services/firestore-sync';
import { Auth } from './services/auth';
import { Beverage } from './services/beverage';


@Component({
  selector: 'app-root',
  imports: [FormsModule, NgClass],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App implements OnInit {

  // per gestire scroll
  @ViewChild('terminal') terminalRef!: ElementRef;
  @ViewChild('cmdInput') cmdInput!: ElementRef;

  // attributes
  protected title = computed(() => 'focus-terminal');
  protected lines: WritableSignal<string[]> = signal<string[]>([]);
  protected command: WritableSignal<string> = signal('');
  // classico terminale frccia in su e giu
  protected history = signal<string[]>([]);
  protected historyIndex = signal<number>(-1);

  // serivizi
  protected _timer = inject(Timer);
  protected _commandParser = inject(CommandParser);
  private _http = inject(HttpClient);
  private _todo = inject(Todo);
  private _music = inject(Audio);
  private _auth = inject(Auth)
  private _beverage = inject(Beverage)

  // comandi 
  private readonly COMMANDS = [
    'start', 'stop', 'status', 'sessions',
    'clear', 'help', 'pomodoro', 'add',
    'done', 'todos', 'theme', 'play',
    'pause', 'auth', 'weekly', 'settings', 'drink', 'drinks'
  ];

  // opzioni disponibili per i comandi
  private readonly COMMAND_OPTIONS: Record<string, string[]> = {
    theme: ['green', 'amber', 'red', 'cyan'],
    play: ['rain', 'white-noise', 'lofi'],
    auth: ['login', 'register', 'logout', 'status'],
  };

  // tema
  private theme: WritableSignal<string> = signal('green')

  // quotes motivazionali
  protected quotes: WritableSignal<string[]> =
    signal([
      "Never stop starting, never start stopping.",
      "Success is the sum of small efforts repeated day in and day out.",
      "Do it today, not tomorrow.",
      "Discipline beats motivation.",
      "Every mistake is a step toward success.",
      "If you want something you've never had, you must do something you've never done.",
      "Consistency creates results.",
      "Don't wait for opportunity, create it.",
      "The limit exists only in your mind.",
      "Small daily progress leads to big results.",
      "Don't fear failure, fear not trying.",
      "Be stronger than your excuses.",
      "Hard work always pays off.",
      "Turn pain into power.",
      "Believe in yourself, always.",
      "Don't quit now.",
      "Do what you can, with what you have, where you are.",
      "Every day is a new opportunity.",
      "The hard road leads to amazing destinations.",
      "Become the best version of yourself."
    ]);

  // associazione nome tema --> classe tailwind
  protected themeClass = computed(() => {
    const map: Record<string, string> = {
      green: 'text-green-400',
      amber: 'text-amber-400',
      red: 'text-red-400',
      cyan: 'text-cyan-400',
    };
    // base resta sempre green
    return map[this.theme()] ?? 'text-green-400';
  });

  constructor() {
    // local storage
    effect(() => {
      localStorage.setItem('focus-sessions', JSON.stringify(this._timer.sessions()));
    });

    // varie quotes
    effect(() => {
      if (this._timer.sessionCompleted()) {
        const quote = this.quotes()[Math.floor(Math.random() * this.quotes().length)];
        this.lines.update(l => [...l, '', `  "${quote}"`, '']);
      }
    });

    // Mantieni il focus sull'input
    effect(() => {
      this.lines();
      this.command();
      setTimeout(() => {
        this.cmdInput?.nativeElement?.focus();
      }, 0);
    });
  }

  // scritta carina inziale
  ngOnInit() {
    this._http.get('banner.txt', { responseType: 'text' }).subscribe(text => {
      const ascii = text.split('\n');
      this.lines.set([
        ...ascii,
        '',
        '   FOCUS TERMINAL v1.0.0',
        '   Type "help" to see available commands',
        '   Made by Ferro with ❤️.',
        '',
      ]);
    });

    // local storage
    const stored = localStorage.getItem('focus-sessions');
    if (stored) this._timer.sessions.set(JSON.parse(stored));

    // firebase se auth
    const firebaseSync = inject(FirestoreSync);
    firebaseSync.loadUserData().then(data => {
      if (data) {
        // inizializzo i vari attributi con [] di default o green per il theme
        this._timer.sessions.set(data.sessions || [])
        this._todo.tasks.set(data.tasks || [])
        this.theme.set(data.theme || 'green')
        if (data.settings) {
          this._timer.settings.set(data.settings);
        }
      }
    })

    // Salva il tema su Firestore quando cambia
    effect(() => {
      firebaseSync.saveTheme(this.theme());
    });

    // Salva i settings su Firestore quando cambiano
    effect(() => {
      firebaseSync.saveSettings(this._timer.settings());
    });

    // permesso per notifiche
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notification granted');
        }
      });
    }

    // scorciatoie
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        this._timer.startPomodoro(); // Ctrl+K = Pomodoro
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        this.lines.set([]); // Ctrl+L = Clear
      }
    });
  }

  // Manteni il focus sull'input quando clicchi da qualsiasi parte
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    event.stopPropagation();
    this.cmdInput?.nativeElement?.focus();
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowUp') {
      event.preventDefault(); // blocco il comportamento normale
      // mi calcolo l'indice del precedente
      const index = Math.min(this.historyIndex() + 1, this.history().length - 1);
      this.historyIndex.set(index);
      // scelgo il comandi
      this.command.set(this.history()[this.history().length - 1 - index] ?? '');
    }
    if (event.key === 'ArrowDown') {
      // stessa cosa di arrowUp
      event.preventDefault();
      const index = Math.max(this.historyIndex() - 1, -1); // stavolta ovviamente max non min
      this.historyIndex.set(index);
      this.command.set(index === -1 ? '' : this.history()[this.history().length - 1 - index]);
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      this.autoComplete();
    }
  }

  // Gestisci i comandi
  handleCommand() {
    const trimmed = this.command().trim();
    if (!trimmed) return;

    // risultato dal parse
    const result = this._commandParser.parse(trimmed);
    // aggiungo il risultato alla history per poi usarlo
    this.history.update(h => [...h, trimmed]);
    this.historyIndex.set(-1);
    this.command.set('');

    if (result.action === 'CLEAR') {
      this.lines.set([]);
    } else {
      this.lines.update(l => [...l, `> ${trimmed}`, ...result.output]);
    }

    // focus ogni tanto
    setTimeout(() => {
      this.scrollToBottom();
      this.cmdInput.nativeElement.focus()
    }, 0);

    //-------------------------------------------
    // blocco per comandi
    if (result.action === 'START_TIMER' && result.duration) {
      this._timer.start(result.duration); // faccio partire
    } else if (result.action === 'STOP_TIMER') {
      this._timer.stop(); // stoppo
    } else if (result.action === 'SESSIONS_HISTORY') {
      const list = this._timer.sessions();
      if (list.length === 0) {
        // se non ci sono state sessioni
        this.lines.update(l => [...l, '📋 Sessions:', 'No sessions yet.']);
      } else {
        // stampo tutta la history delle sessioni
        const output = list.map((s, i) =>
          `  ${i + 1}. ⏱️ ${s.duration} min — ${s.completedAt.toLocaleTimeString()}`
        );
        this.lines.update(l => [...l, '📋 Sessions:', ...output]);
      }
    } else if (result.action === 'STATUS') {
      const msg = this._timer.isRunning() // messaaggio ritorno
        ? `Session active — ${this._timer.format()} remaining` // sessione attiva
        : 'No active session.'; // sessione non attiva
      this.lines.update(l => [...l, msg]); // scrivo
    } else if (result.action === 'CHANGE_THEME' && result.theme) {
      // aggiorno il signal con il colore scelto
      this.theme.set(result.theme);
    } else if (result.action === 'ADD_TASK' && result.task) {
      // uso il servizio per aggiungere un task
      this._todo.add(result.task);
      this.lines.update(l => [...l, `  ➕ Task added: ${result.task}`]);
    } else if (result.action === 'TODOS') {
      // prendo dal servizio e stampo
      const todos = this._todo.getAll();
      const output = todos.length === 0 ? ['No tasks yet.'] : todos;
      this.lines.update(l => [...l, '📝 Tasks:', ...output]);
    } else if (result.action === 'DONE' && result.n) {
      // uso il servizio per completare
      this._todo.complete(result.n);
      this.lines.update(l => [...l, `  ✅ Task ${result.n} completed!`]);
    } else if (result.action === 'POMODORO') {
      this._timer.startPomodoro();
      this.lines.update(l => [...l, `  🍅 Pomodoro started — ${this._timer.settings().workMinutes}min focus / ${this._timer.settings().breakMinutes}min break`]);
    } else if (result.action === 'PLAY' && result.genre) {
      this._music.play(result.genre as 'rain' | 'white-noise' | 'lofi');
      this.lines.update(l => [...l, `  🎵 Playing ${result.genre}...`]);
    } else if (result.action === 'PAUSE') {
      this._music.stop();
      this.lines.update(l => [...l, `  ⏸️ Music paused`]);
    } else if (result.action === 'LOGIN' && result.email && result.password) {
      try {
        this._auth.login(result.email, result.password)
        this.lines.update(l => [...l, '🔐 Login Successful!', '👋 Welcome back'])
      } catch (error: any) {
        this.lines.update(l => [...l, `Error: ${error.message}`])
      }
    } else if (result.action === 'REGISTER' && result.email && result.password) {
      try {
        this._auth.register(result.email, result.password)
        this.lines.update(l => [...l, '🎉 Registered Successful!', `🔓 Logged in as ${result.email}`])
      } catch (error: any) {
        this.lines.update(l => [...l, `Error: ${error.message}`])
      }
    } else if (result.action === 'LOGOUT') {
      try {
        this._auth.logout()
        this.lines.update(l => [...l, '🚪 Logout Successful!',])
      } catch (error: any) {
        this.lines.update(l => [...l, `Error: ${error.message}`])
      }
    } else if (result.action === 'AUTH_STATUS') {
      const user = this._auth.currentUser();
      if (user) {
        const email = user?.email || 'Anonymous';
        this.lines.update(l => [...l, `👤 Logged as: ${email}`]);
      } else {
        this.lines.update(l => [...l, '❌ Not logged in']);
      }
    } else if (result.action === 'SETTINGS') {
      // Mostra i settings correnti o aggiorna
      if (!result.key) {
        // mostra stato corrente
        const settings = this._timer.settings();
        const output = [
          '⚙️ SETTINGS',
          '  🎨 current-theme: ' + this.theme(),
          `  ⏰ pomodoro-work: ${settings.workMinutes} min`,
          `  ☕ pomodoro-break: ${settings.breakMinutes} min`,
          '  -',
          '  Usage: settings <key> <value>',
          '  Example: settings pomodoro-work 30'
        ];
        this.lines.update(l => [...l, ...output]);
      } else if (result.key && result.n !== undefined) {
        // aggiorna il setting
        const settings = this._timer.settings();
        // valori vecchi
        const oldValue = 
          result.key === 'pomodoro-work' ? settings.workMinutes :
          result.key === 'pomodoro-break' ? settings.breakMinutes : null;

        // altri sotto 
        if (result.key === 'pomodoro-work') {
          this._timer.settings.set({ ...settings, workMinutes: result.n });
        } else if (result.key === 'pomodoro-break') {
          this._timer.settings.set({ ...settings, breakMinutes: result.n });
        }
        
        const output = [`  ✨ ${result.key}: ${oldValue} min → ${result.n} min`];
        this.lines.update(l => [...l, ...output]);
      }
    } else if (result.action === 'STATS') {
      // calcolo
      const stats = this._timer.calculateStats();
      // template carino
      const output = [
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '     📊 PRODUCTIVITY STATS',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        `  💪 Total Sessions: ${stats.totalSessions}`,
        `  ⏱️ Total Time: ${this.formatDuration(stats.totalMinutes)}`,
        `  📈 Average: ${stats.averageDuration}min`,
        '',
        `  📅 Today: ${stats.todaySessions} sessions / ${this.formatDuration(stats.todayMinutes)}`,
        `  📆 This Week: ${stats.weekSessions} sessions / ${this.formatDuration(stats.weekMinutes)}`,
        '',
        `  🔥 Current Streak: ${stats.currentStreak} days`,
        `  🏆 Best Streak: ${stats.bestStreak} days`,
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
      ];
      this.lines.update(l => [...l, ...output]);
    } else if (result.action === 'WEEKLY') {
      // calcolo con il metodo dal timer
      const weeklyStats = this._timer.getBarChart()
      this.lines.update(l => [...l, '📉 WEEKLY STATS', ...weeklyStats]);
    } else if (result.action === 'PROFILE') {
      const stats = this._timer.calculateStats();
      const user = this._auth.currentUser();
      
      // Calcola giorni da quando si è registrato
      let joinedDays = 'N/A';
      if (user?.metadata?.creationTime) {
        const createdDate = new Date(user.metadata.creationTime);
        const now = new Date();
        const days = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        joinedDays = `${days} days ago`;
      }
      
      const output = [
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '          👤 PROFILE',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        `  📬 Email: ${user?.email || 'Not logged in'}`,
        `  Joined: ${joinedDays}`,
        '',
        '  📈 Stats:',
        `    ⏰ Total Time: ${this.formatDuration(stats.totalMinutes)}`,
        `    Sessions: ${stats.totalSessions}`,
        `    Avg Duration: ${stats.averageDuration}min`,
        '',
        `  🔥 Best Streak: ${stats.bestStreak} days`,
        `  📅 Current Streak: ${stats.currentStreak} days`,
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
      ];
      this.lines.update(l => [...l, ...output]);
    } else if (result.action === 'DRINK' && result.drinkType) {
      this._beverage.add(result.drinkType);
      this.lines.update(l => [...l, `  🥤 ${result.drinkType} added!`]);
    } else if (result.action === 'DRINKS') {
      const count = this._beverage.getTodayCount();
      if (Object.keys(count).length === 0) {
        this.lines.update(l => [...l, '🥤 No beverages logged today.']);
      } else {
        const output = ['🥤 Beverages Today:'];
        Object.entries(count).forEach(([type, qty]) => {
          output.push(`  • ${qty}x ${type}`);
        });
        this.lines.update(l => [...l, ...output]);
      }
    }

  }

  // fine blocco per comandi
  //-------------------------------------------


  /**
   * metodo per scrollare giu, lo chiamo con l'afterview
   */
  scrollToBottom() {
    const el = this.terminalRef?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  autoComplete() {
    // parte attuale
    const current = this.command().trim()
    if (!current) return;

    // Dividi il comando e gli argomenti
    const parts = current.split(' ');
    const cmd = parts[0];
    const arg = parts.slice(1).join(' ').toLowerCase();

    // Se è un comando con opzioni disponibili
    if (this.COMMAND_OPTIONS[cmd]) {
      const options = this.COMMAND_OPTIONS[cmd];

      // Se l'argomento è vuoto, mostra tutte le opzioni
      if (!arg) {
        this.lines.update(l => [...l, `> ${current}`, options.join('   ')]);
        return;
      }

      // Filtra le opzioni che iniziano con arg
      const matches = options.filter(opt => opt.startsWith(arg));

      if (matches.length === 1) {
        this.command.set(`${cmd} ${matches[0]}`);
      } else if (matches.length > 1) {
        this.lines.update(l => [...l, `> ${current}`, matches.join('   ')]);
      }
    } else {
      // Autocompletion per i comandi
      const matches = this.COMMANDS.filter(command => command.startsWith(current))

      // o completo o mostro i vari
      if (matches.length === 1) {
        this.command.set(matches[0]);
      } else if (matches.length > 1) {
        // suggerimenti 
        this.lines.update(l => [...l, `> ${current}`, matches.join('   ')]);
      }
    }
  }

  // helper stats
  private formatDuration(minutes: number): string {
    // ore e min
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  }
}


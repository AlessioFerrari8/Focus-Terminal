import {
  Component, computed, signal, WritableSignal,
  ElementRef, ViewChild, AfterViewChecked,
  inject,
  OnInit,
  effect,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Timer } from './services/timer';
import { CommandParser } from './services/command-parser';
import { HttpClient } from '@angular/common/http';
import { NgClass } from '@angular/common';


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

  // comandi 
  private readonly COMMANDS = ['start', 'stop', 'status', 'sessions', 'clear', 'help'];

  // tema
  private theme: WritableSignal<string> = signal('green')

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
    effect(() => {
      localStorage.setItem('focus-sessions', JSON.stringify(this._timer.sessions()));
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

  // TODO: gestire il problema che devo cliccare ogni volta
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

    // fare switch
    if (result.action === 'START_TIMER' && result.duration) {
      this._timer.start(result.duration); // faccio partire
    } else if (result.action === 'STOP_TIMER') {
      this._timer.stop(); // stoppo
    } else if (result.action === 'SESSIONS_HISTORY') {
      const list = this._timer.sessions();
      if (list.length === 0) {
        // se non ci sono state sessioni
        this.lines.update(l => [...l, 'Sessions:', 'No sessions yet.']);
      } else {
        // stampo tutta la history delle sessioni
        const output = list.map((s, i) =>
          `  ${i + 1}. ${s.duration} min — ${s.completedAt.toLocaleTimeString()}`
        );
        this.lines.update(l => [...l, 'Sessions:', ...output]);
      }
    } else if (result.action === 'STATUS') {
      const msg = this._timer.isRunning() // messaaggio ritorno
        ? `Session active — ${this._timer.format()} remaining` // sessione attiva
        : 'No active session.'; // sessione non attiva
      this.lines.update(l => [...l, msg]); // scrivo
    } else if (result.action === 'CHANGE_THEME' && result.theme) {
      // aggiorno il signal con il colore scelto
      this.theme.set(result.theme); 
    }


  }

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

    // possibili
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


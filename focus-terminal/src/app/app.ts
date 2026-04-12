import {
  Component, computed, signal, WritableSignal,
  ElementRef, ViewChild, AfterViewChecked,
  inject,
  OnInit,
  effect
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Timer } from './services/timer';
import { CommandParser } from './services/command-parser';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
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
  protected sessions: WritableSignal<any> = signal([]);
  // classico terminale frccia in su e giu
  protected history = signal<string[]>([]);
  protected historyIndex = signal<number>(-1);


  // serivizi
  protected _timer = inject(Timer);
  protected _commandParser = inject(CommandParser);

  constructor() {
    effect(() => {
      localStorage.setItem('focus-sessions', JSON.stringify(this.sessions()));
    });
  }

  // scritta carina inziale
  ngOnInit() {
    const boot = [
      '==========================================',
      '   FOCUS TERMINAL v1.0.0',
      '   Type "help" to see available commands',
      '   Made by Ferro with ❤️.',
      '==========================================',
      '',
    ];
    this.lines.set(boot);
    // local storage
    const stored = localStorage.getItem('focus-sessions');
    if (stored) this.sessions.set(JSON.parse(stored));
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
      this.lines.update(l => [...l, `> ${trimmed}`, msg]); // scrivo
    }


  }

  /**
   * metodo per scrollare giu, lo chiamo con l'afterview
   */
  scrollToBottom() {
    const el = this.terminalRef?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}


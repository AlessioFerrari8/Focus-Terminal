import {
  Component, computed, signal, WritableSignal,
  ElementRef, ViewChild, AfterViewChecked
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App {

  // per gestire scroll
  @ViewChild('terminal') terminalRef!: ElementRef;
  @ViewChild('cmdInput') cmdInput!: ElementRef;

  // attributes
  protected title = computed(() => 'focus-terminal');
  protected lines: WritableSignal<string[]> = signal<string[]>([]);
  protected command: WritableSignal<string> = signal('');

  // TODO: gestire il problema che devo cliccare ogni volta
  handleCommand() {
    const trimmed = this.command().trim();
    if (trimmed) {
      this.lines.update(l => [...l, `> ${trimmed}`]);
      this.command.set('');
      // focus ogni tanto
      setTimeout(() => {
        this.scrollToBottom();
        this.cmdInput.nativeElement.focus()
      }, 0);

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


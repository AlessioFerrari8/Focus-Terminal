import { effect, inject, Injectable, signal, WritableSignal } from '@angular/core';
import { FirestoreSync } from './firestore-sync';


export type Todos = {
  id: number;
  text: string;
  done: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class Todo {
  private firebaseSync = inject(FirestoreSync)
  // semplifico e non uso più signal 
  tasks: WritableSignal<any[]> = signal<any[]>([]);

  constructor() {
    // Sincronizza i task quando cambiano
    effect(() => {
      this.firebaseSync.saveTasks(this.tasks());
    });
  }


  add(text: string): void {
    // restituisco un nuovo 
    this.tasks.update(old => [...old, { id: old.length + 1, text, done: false }]);
  }

  complete(n: number): void {
    // indice - 1 perché si parte da 0
    this.tasks.update(old =>
      old.map((task, i) => i === n - 1 ? { ...task, done: true } : task)
    );
  }

  getAll(): string[] {
    // ritorno array con tutte task
    return this.tasks().map((task, i) =>
      `  ${i + 1}. [${task.done ? 'x' : ' '}] ${task.text}`
    );
  }

}

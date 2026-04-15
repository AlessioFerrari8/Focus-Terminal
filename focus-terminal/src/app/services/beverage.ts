import { Injectable, signal, WritableSignal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Beverage {
  beverages: WritableSignal<{ type: string; timestamp: Date}[]> = signal([]);

  // nuova bevanda energetica
  add(type: string) {
    this.beverages.update(old => [...old, { type, timestamp: new Date() }]);
  }

  // prendo le bevande di oggi
  getToday() {
    const today = new Date().toDateString();
    return this.beverages().filter(b => new Date(b.timestamp).toDateString() === today);
  }

  getTodayCount() {
    // oggi + count
    const today = this.getToday();
    const count: Record<string, number> = {};
    today.forEach(b => {
      count[b.type] = (count[b.type] || 0) + 1;
    });
    return count;
  }
}

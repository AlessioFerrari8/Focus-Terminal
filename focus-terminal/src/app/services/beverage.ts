import { Injectable, signal, WritableSignal } from '@angular/core';
import { BEVERAGES, BeverageType } from '../core/beverage/beverage.model';

@Injectable({
  providedIn: 'root',
})
export class Beverage {
  beverages: WritableSignal<{ type: string; timestamp: Date; beverage?: BeverageType }[]> = signal([]);

  // nuova bevanda energetica
  add(type: string) {
    const beverageData = BEVERAGES[type.toLowerCase()]
    this.beverages.update(old => [...old, {
      type,
      timestamp: new Date(),
      beverage: beverageData
    }]);
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

  // Restituisce i dati della bevanda (per accedere a immagine, colore, etc)
  getBeverageData(type: string): BeverageType | undefined {
    return BEVERAGES[type.toLowerCase()];
  }

  // Restituisce tutte le bevande disponibili
  getAllBeverages(): BeverageType[] {
    return Object.values(BEVERAGES);
  }
}

import { Injectable, signal, WritableSignal } from '@angular/core';
import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  // attributi
  // utente
  currentUser: WritableSignal<User | null> = signal<User | null>(null);
  isLoading: WritableSignal<boolean> = signal(false);
  error: WritableSignal<string | null> = signal<string | null>(null);

  constructor() {
    // solita procedura 
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      this.currentUser.set(user);
    })
  }

  // registrazione
  async register(email: string, password: string) {
    // prendo sempre auth -> serve per create...
    const auth = getAuth();
    // aggiorno i due attributi
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password)
      return res.user;
    } catch (err: any) {
      this.error.set(err.message);
      throw err;
    } finally {
      // devo aggiornare il loading
      this.isLoading.set(false);
    }
  }


  // login
  async login(email: string, password: string) {
    // prendo sempre auth -> serve per sign...
    const auth = getAuth();
    // aggiorno i due attributi
    this.isLoading.set(true);
    this.error.set(null);
    try {
      // cambio solo il metodo
      const res = await signInWithEmailAndPassword(auth, email, password)
      return res.user;
    } catch (err: any) {
      this.error.set(err.message);
      throw err;
    } finally {
      // devo aggiornare il loading
      this.isLoading.set(false);
    }
  }


  // logout
  async logout() {
    // prendo sempre auth -> serve per sign...
    const auth = getAuth();
    try {
      // basta chiamare il signOut
      const res = await signOut(auth)
    } catch (err) {
      console.error("Error while logging out", err)
    } 
  }
}

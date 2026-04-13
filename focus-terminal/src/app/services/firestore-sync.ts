import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

interface UserData {

}

@Injectable({
  providedIn: 'root',
})
export class FirestoreSync {
  // cose di firestore
  private _firestore = inject(Firestore);
  private _auth = inject(Auth)
  // User non interfaccia, ma da firebase
  private _currentUser: User | null = null;

  constructor() {
    onAuthStateChanged(this._auth, (user) => {
      this._currentUser = user;
    });
  }

  // salvo sessioni su fs
  async saveSessions(sessions: any[]) {
    // se non sono loggato
    if (!this._currentUser) {
      console.warn("You're not logged, only saving if you are")
      return;
    }

    try {
      // salvataggio su firestore
      const userDocRef = doc(this._firestore, 'users', this._currentUser.uid);
      await updateDoc(userDocRef, {
        sessions: sessions,
        updatedAt: new Date()
      });

      console.log('Sessions saved on firestore!');
    } catch (error) {
      console.error('Error while saving sessions:', error);
    }
  }

  async saveTasks() {

  }

  async saveTheme() {

  }

  async loadUserData() {

  }

  // sinc tempo reale
  onUserDataChange() {

  }

  private async createNewUser() {
    
  }
}

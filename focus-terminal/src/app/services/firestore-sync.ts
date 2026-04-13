import { Injectable } from '@angular/core';
import { onAuthStateChanged, getAuth, User } from 'firebase/auth';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';

interface UserData {

}

@Injectable({
  providedIn: 'root',
})
export class FirestoreSync {
  private _currentUser: User | null = null;

  constructor() {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
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
      const firestore = getFirestore();
      const userDocRef = doc(firestore, 'users', this._currentUser.uid);
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

import { Injectable } from '@angular/core';
import { onAuthStateChanged, getAuth, User } from 'firebase/auth';
import { doc, updateDoc, getFirestore, getDoc, onSnapshot, setDoc } from 'firebase/firestore';

interface UserData {
  email: string;
  createdAt: Date;
  sessions: any[];
  tasks: any[];
  theme: string;
  updatedAt: Date;
}


@Injectable({
  providedIn: 'root',
})
export class FirestoreSync {
  private _currentUser: User | null = null;

  constructor() {
    // Lazy load: aspetta che Firebase sia inizializzato
    setTimeout(() => {
      try {
        const auth = getAuth();
        onAuthStateChanged(auth, (user) => {
          this._currentUser = user;
        });
      } catch (error) {
        console.warn('Firebase non ancora inizializzato in FirestoreSync:', error);
      }
    }, 0);
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

  // salvo le task, prendo in argomento i vari task
  async saveTasks(tasks: any[]) {
    if (!this._currentUser) return; // non esiste l'utente

    try {
      const firestore = getFirestore();
      const userDocRef = doc(firestore, 'users', this._currentUser.uid);
      await updateDoc(userDocRef, {
        tasks: tasks,
        updatedAt: new Date()
      });
      console.log('Tasks saved on firestore!');
    } catch (error) {
      console.error('Error while saving tasks:', error);
    }
  }

  // salvo tema, prendo in argomento il tema
  async saveTheme(theme: string) {
    if (!this._currentUser) return;

    try {
      // solito procedimento
      const firestore = getFirestore();
      const userDocRef = doc(firestore, 'users', this._currentUser.uid);
      await updateDoc(userDocRef, {
        theme: theme,
        updatedAt: new Date()
      })
      console.log('Theme saved on firestore!');
    } catch (error) {
      console.error('Error while saving theme:', error);
    }
  }

  /**
   * carico utente
   * @returns utente o null
   */
  async loadUserData(): Promise<UserData | null> {
    if (!this._currentUser) return null;

    try {
      // solito
      const firestore = getFirestore();
      const userDocRef = doc(firestore, 'users', this._currentUser.uid);
      // salvo lo snap
      const userSnap = await getDoc(userDocRef)

      if (userSnap.exists()) {
        // ritorno lo snap in formato interfaccia
        return userSnap.data() as UserData;
      } else {
        // creo nuovo utente
        await this.createNewUser()
        return null;
      }
    } catch (error) {
      console.error('Error while loading data', error)
      return null;
    }

  }

  // sinc tempo reale
  onUserDataChange(callback: (data: UserData | null) => void) {
    const auth = getAuth(); 
    onAuthStateChanged(auth, (user) => {
      const firestore = getFirestore();
      if (user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            callback(snapshot.data() as UserData);
          }
        });
      } else {
        callback(null);
      }
    });
  }

  private async createNewUser() {
    if (!this._currentUser) return;


    try {
      // solito
      const firestore = getFirestore();
      const userDocRef = doc(firestore, 'users', this._currentUser.uid);
      // aggiorno con i vari campi default
      await setDoc(userDocRef, {
        email: this._currentUser.email,
        createdAt: new Date(),
        sessions: [],
        tasks: [],
        theme: 'green',
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Error while creating document for new user:', error);
    }
  }
}

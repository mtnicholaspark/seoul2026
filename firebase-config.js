// Firebase project config — fill these in from Firebase Console → Project settings → Your apps → Web app.
// This config is a public client identifier (not a secret); access is controlled by Firestore
// security rules (see firestore.rules), not by hiding this object.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
import {
  getFirestore,
  enableIndexedDbPersistence,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'REPLACE_ME',
  authDomain: 'REPLACE_ME.firebaseapp.com',
  projectId: 'REPLACE_ME',
  storageBucket: 'REPLACE_ME.appspot.com',
  messagingSenderId: 'REPLACE_ME',
  appId: 'REPLACE_ME',
};

export const firebaseConfigured = firebaseConfig.apiKey !== 'REPLACE_ME';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

if (firebaseConfigured) {
  try {
    await enableIndexedDbPersistence(db);
  } catch (err) {
    if (err.code === 'failed-precondition') {
      console.warn('Offline persistence disabled: another tab already has it open.');
    } else if (err.code === 'unimplemented') {
      console.warn('Offline persistence unsupported in this browser.');
    }
  }
}

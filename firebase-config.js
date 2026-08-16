// Firebase project config — fill these in from Firebase Console → Project settings → Your apps → Web app.
// This config is a public client identifier (not a secret); access is controlled by Firestore
// security rules (see firestore.rules), not by hiding this object.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
import {
  getFirestore,
  enableIndexedDbPersistence,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBw2U-pk5B_HDcwQHzCb4iQGeLjLVzDC2Q',
  authDomain: 'seoul-2026-fb765.firebaseapp.com',
  projectId: 'seoul-2026-fb765',
  storageBucket: 'seoul-2026-fb765.firebasestorage.app',
  messagingSenderId: '348296188371',
  appId: '1:348296188371:web:c914a73217fd6050ffdf26',
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

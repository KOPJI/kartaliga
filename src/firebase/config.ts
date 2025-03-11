import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: "manajemen-turnamen",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  databaseURL: `https://${process.env.REACT_APP_FIREBASE_PROJECT_ID}.firebaseio.com`
};

// Pastikan konfigurasi valid
if (!firebaseConfig.projectId) {
  throw new Error('Firebase projectId tidak ditemukan dalam konfigurasi');
}

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Inisialisasi Firestore dengan opsi khusus
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

export default app;

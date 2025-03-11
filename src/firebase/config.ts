import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyBX_qnWNYHIqN3YquQKmmM7lMNjK3O62Ls",
  authDomain: "manajemen-turnamen.firebaseapp.com",
  projectId: "manajemen-turnamen",
  storageBucket: "manajemen-turnamen.firebasestorage.app",
  messagingSenderId: "873449207450",
  appId: "1:873449207450:web:a80175d6aeeb35211a9123"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

export default app;

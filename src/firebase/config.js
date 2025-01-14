import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Your Firebase configuration object
  apiKey: "AIzaSyDEQGAGxGNdutCBrdkdxW1hNHbXh_4ihhQ",
  authDomain: "subscribe-13d50.firebaseapp.com",
  projectId: "subscribe-13d50",
  storageBucket: "subscribe-13d50.firebasestorage.app",
  messagingSenderId: "1060844521585",
  appId: "1:1060844521585:web:394455c6491351010c33d0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); 
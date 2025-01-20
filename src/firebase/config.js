import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase with error handling
let app;
let db;

try {
  // Validate config before initialization
  const missingKeys = Object.keys(firebaseConfig).filter(key => !firebaseConfig[key]);
  if (missingKeys.length > 0) {
    throw new Error(`Missing Firebase configuration keys: ${missingKeys.join(', ')}`);
  }

  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  
  // Enable offline persistence with error handling
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser doesn\'t support persistence.');
    }
  });
} catch (error) {
  console.error('Error initializing Firebase:', error);
  // Add more detailed error logging
  if (error.code) {
    console.error('Firebase error code:', error.code);
  }
}

export { db };

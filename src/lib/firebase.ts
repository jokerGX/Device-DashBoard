import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration using environment variables
const firebaseConfig = {
    apiKey: "AIzaSyDd1DLbXzLxrYUR4wAonjY4639QErsaQkU",
    authDomain: "battery-info-ce6a1.firebaseapp.com",
    databaseURL: "https://battery-info-ce6a1-default-rtdb.firebaseio.com",
    projectId: "battery-info-ce6a1",
    storageBucket: "battery-info-ce6a1.firebasestorage.app",
    messagingSenderId: "699041872773",
    appId: "1:699041872773:web:834cfeb2ec910f4bdc22ec",
    measurementId: "G-ZGDQ5PCQG9"
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };

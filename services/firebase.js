import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDdj1cs7x7DPgHS47KFMGSi4k_B0pGgwsw",
  authDomain: "coride-2026.firebaseapp.com",
  projectId: "coride-2026",
  storageBucket: "coride-2026.firebasestorage.app",
  messagingSenderId: "69770792543",
  appId: "1:69770792543:web:bdeb4753a10ac31cd015ea",
  measurementId: "G-RCPW8QFPSX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
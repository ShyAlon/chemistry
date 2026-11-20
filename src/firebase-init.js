import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';
import {getAI,GoogleAIBackend} from 'firebase/ai';

// Public web client configuration for spectra-chemistry. Firebase client
// config is not a secret; access is gated by Auth (authenticated-users
// mode) and Firestore rules, both verified against the live project.
const firebaseConfig={
  apiKey:'AIzaSyCuq8j67fkcOrxCMNFXMXS0be3OUsrkpFU',
  authDomain:'spectra-chemistry.firebaseapp.com',
  projectId:'spectra-chemistry',
  storageBucket:'spectra-chemistry.firebasestorage.app',
  messagingSenderId:'338176784236',
  appId:'1:338176784236:web:3bd5ade28dde27ac98a549',
};

export const app=initializeApp(firebaseConfig);
export const auth=getAuth(app);
export const db=getFirestore(app);
// Gemini Developer API backend: the free-tier provider verified live on
// this project (authenticated-users mode, no billing).
export const ai=getAI(app,{backend:new GoogleAIBackend()});

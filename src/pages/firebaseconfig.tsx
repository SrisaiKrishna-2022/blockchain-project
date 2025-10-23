// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCf1fR3yJo5uh21SR5BPoDycA63xB-y4pc",
  authDomain: "blockchain-24fbf.firebaseapp.com",
  projectId: "blockchain-24fbf",
  storageBucket: "blockchain-24fbf.firebasestorage.app",
  messagingSenderId: "231904431471",
  appId: "1:231904431471:web:cdeda388215041f4bc6c9a",
  measurementId: "G-V1LZDC931C"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Optional helper to log during dev
export default function FirebaseConfig() {
  console.log("Firebase initialized:", app, analytics, auth, db);
}
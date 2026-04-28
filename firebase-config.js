// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD4FS4d3_Dd2Bb1Rgn2EtMe1pDdr5Uy3vQ",
  authDomain: "check-7ef70.firebaseapp.com",
  projectId: "check-7ef70",
  storageBucket: "check-7ef70.firebasestorage.app",
  messagingSenderId: "871236501125",
  appId: "1:871236501125:web:195605338d3950ce01f3ec",
  measurementId: "G-KPQQPWK6QH",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

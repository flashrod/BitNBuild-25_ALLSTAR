
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyASYceL89mTsywCXZ1B-qEiLp1I68LS89o",
  authDomain: "taxwise-5c52e.firebaseapp.com",
  projectId: "taxwise-5c52e",
  storageBucket: "taxwise-5c52e.firebasestorage.app",
  messagingSenderId: "697161373171",
  appId: "1:697161373171:web:3181886ff69b0c168bee86",
  measurementId: "G-64REKPJNXE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
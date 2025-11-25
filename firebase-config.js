// Firebase configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBAbtxaOGOATE53X-Dhxa95_QGTz1Lk6dI",
  authDomain: "oxypulse-d31f8.firebaseapp.com",
  databaseURL: "https://oxypulse-d31f8-default-rtdb.firebaseio.com",
  projectId: "oxypulse-d31f8",
  storageBucket: "oxypulse-d31f8.firebasestorage.app",
  messagingSenderId: "134662163255",
  appId: "1:134662163255:web:2b7bc1df234e973275e8b2",
  measurementId: "G-Z81BVG6TWL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

export { app, auth, database }; 
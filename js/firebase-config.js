// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDafyxtNyY9VNzl-lrsMY6uqpKBh-N5fTQ",
  authDomain: "project-who-57771.firebaseapp.com",
  projectId: "project-who-57771",
  storageBucket: "project-who-57771.firebasestorage.app",
  messagingSenderId: "70583164472",
  appId: "1:70583164472:web:9946991130c8ba304190cd",
  measurementId: "G-01R3BCGZ5F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Make them globally available
window.auth = auth;
window.db = db;
window.firebaseApp = app;

console.log('Firebase initialized successfully');

// Export for use in other modules (if needed)
export { app, analytics, auth, db };
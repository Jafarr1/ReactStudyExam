// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDGjTniUJZiAOgv_hhh8trLuMKKFKjXnqA",
  authDomain: "studyexam-7c425.firebaseapp.com",
  projectId: "studyexam-7c425",
  storageBucket: "studyexam-7c425.firebasestorage.app",
  messagingSenderId: "796538594855",
  appId: "1:796538594855:web:a11d34a932d2f710179002"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getFirestore(app);

export { app, database };
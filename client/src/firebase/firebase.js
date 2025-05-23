// firebase/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
   apiKey: "AIzaSyCSaRy4QsQ3hhZ0y3o6GxlVUqXXHBC2qIM",
   authDomain: "permission-app-54eb9.firebaseapp.com",
   projectId: "permission-app-54eb9",
   storageBucket: "permission-app-54eb9.firebasestorage.app",
   messagingSenderId: "1096097890767",
   appId: "1:1096097890767:web:129f50e193d05bdf6512ba",
   measurementId: "G-YV2V3EB1ZQ",databaseURL: "https://permission-app-54eb9-default-rtdb.firebaseio.com/"

};

export const provider = new GoogleAuthProvider();
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const storage = getStorage(app);

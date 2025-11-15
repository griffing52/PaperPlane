// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyAAx_knJ_qqxPkJQ_xoIZnxt_c6gb6Wdys",
//   authDomain: "todoapp-eeeb7.firebaseapp.com",
//   projectId: "todoapp-eeeb7",
//   storageBucket: "todoapp-eeeb7.appspot.com",
//   messagingSenderId: "1072574112522",
//   appId: "1:1072574112522:web:65fc4e184aed9894dc90f3"
// };

// NEXT_FIREBASE_APIKEY=
// NEXT_FIREBASE_AUTH_DOMAIN=
// NEXT_FIREBASE_PROJECT_ID=
// NEXT_FIREBASE_STORAGE_BUCKET=
// NEXT_FIREBASE_MESSAGE_SENDER_ID=
// NEXT_FIREBASE_APP_ID=

// const firebaseConfig = {
//   apiKey: 'AIzaSyCYH5gxs5z1tiok5yaq2QIx8C0v12SmDEk',
//   authDomain: 'paper-plane-fall-2025.firebaseapp.com',
//   projectId: 'paper-plane-fall-2025',
//   storageBucket: 'paper-plane-fall-2025.firebasestorage.app',
//   messagingSenderId: '208175764121',
//   appId: '1:208175764121:web:48af4cdeb71a3afa4d1e08',
// };


// const firebaseConfig = {
//   apiKey: process.env.NEXT_FIREBASE_APIKEY,
//   authDomain: process.env.NEXT_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_FIREBASE_MESSAGE_SENDER_ID,
//   appId: process.env.NEXT_FIREBASE_APP_ID,
// };

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};




// Initialize Firebase
const app = initializeApp(firebaseConfig);// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;


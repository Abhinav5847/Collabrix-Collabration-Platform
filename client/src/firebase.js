import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCSmOdLpi1dvV0mst9U_izDCflCHrI7AeI",
  authDomain: "collabrix-5ebc6.firebaseapp.com",
  projectId: "collabrix-5ebc6",
  storageBucket: "collabrix-5ebc6.firebasestorage.app",
  messagingSenderId: "995225246003",
  appId: "1:995225246003:web:31309f231b168127ae4646",
  measurementId: "G-LYB0NLV2DN"
};


const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);
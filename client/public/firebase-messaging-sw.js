importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCSmOdLpi1dvV0mst9U_izDCflCHrI7AeI",
  authDomain: "collabrix-5ebc6.firebaseapp.com",
  projectId: "collabrix-5ebc6",
  storageBucket: "collabrix-5ebc6.firebasestorage.app",
  messagingSenderId: "995225246003",
  appId: "1:995225246003:web:31309f231b168127ae4646",
  measurementId: "G-LYB0NLV2DN"
});

console.log("oomb")
const messaging = firebase.messaging();
console.log("oomb")
messaging.onBackgroundMessage(function (payload) {
  console.log("Background message:", payload);

  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
  });
});
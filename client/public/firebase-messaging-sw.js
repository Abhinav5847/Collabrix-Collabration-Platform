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

const messaging = firebase.messaging();

// Handles notifications when the browser is closed or in the background
messaging.onBackgroundMessage(function (payload) {
  console.log("Background message received:", payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/logo192.png", // Make sure this icon exists in public folder
    data: { url: "/" }     // The URL to open when clicked
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// NEW: This ensures the tab opens when the user clicks the notification
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});
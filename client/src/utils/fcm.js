import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "../firebase";
import { api } from '../services/api';

/**
 * 🔔 Register FCM Token and send to backend
 * No parameters needed as backend uses Cookies for Auth
 */
// Inside fcm.js
const sendFCMTokenToBackend = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    // Add a small delay or check if document is hidden to avoid race conditions
    if (document.visibilityState === 'hidden') return;

    const token = await getToken(messaging, {
      vapidKey: "BHGFMrZ9YCsGYh9gamJ1nKjW5OapmMX3V49QITfd8ecMg8GbLyr_GiUpguIOangmRaGQMlGd3ASyrQe0NOXK8yE",
    });

    if (token) {
      localStorage.setItem('fcm_token', token);
      await api.post("accounts/update-fcm-token/", { token });
      console.log("✅ FCM token saved to backend");
    }
  } catch (error) {
    // Check for specific IndexedDB errors to avoid flooding your console
    if (error.message?.includes('IndexedDB')) {
      console.warn("Firebase IndexedDB transition warning - Ignored.");
    } else {
      console.error("🔥 FCM ERROR:", error);
    }
  }
};

/**
 * 📩 Listen for foreground notifications (app open)
 */
export const listenForMessages = () => {
  onMessage(messaging, (payload) => {
    console.log("📩 Foreground message received:", payload);

    if (payload?.notification) {
      // Show browser notification while app is open
      new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: '/logo192.png' // Ensure this exists in your public folder
      });
    }
  });
};

export default sendFCMTokenToBackend;
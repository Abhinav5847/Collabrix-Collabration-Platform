import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "../firebase";
import { api } from '../services/api';

/**

* 🔔 Register FCM Token and send to backend
  */
  const sendFCMTokenToBackend = async (accessToken) => {
  try {
  // 1. Ask permission
  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
  console.log("❌ Notification permission denied");
  return;
  }

  // 2. Get FCM token
  const token = await getToken(messaging, {
  vapidKey: "BHGFMrZ9YCsGYh9gamJ1nKjW5OapmMX3V49QITfd8ecMg8GbLyr_GiUpguIOangmRaGQMlGd3ASyrQe0NOXK8yE", 
  });

  if (!token) {
  console.log("❌ No FCM token received");
  return;
  }

  console.log("✅ FCM TOKEN:", token);

  // 3. Send token to backend
  const response = await api.post("/accounts/update-fcm-token/", {
  token: token,
  });

  if (response.status !== 200 && response.status !== 201) {
  throw new Error("Failed to save FCM token");
}


  console.log("✅ FCM token saved to backend");

} catch (error) {
console.error("🔥 FCM ERROR:", error);
}
};

/**

* 📩 Listen for foreground notifications (app open)
  */
  export const listenForMessages = () => {
  onMessage(messaging, (payload) => {
  console.log("📩 Foreground message received:", payload);

  // Optional: show custom notification
  if (payload?.notification) {
  new Notification(payload.notification.title, {
  body: payload.notification.body,
  });
  }
  });
  };

export default sendFCMTokenToBackend;

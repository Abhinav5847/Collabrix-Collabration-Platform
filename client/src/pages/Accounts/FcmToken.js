// getToken.js
import { getToken } from "firebase/messaging";
import { messaging } from "./firebase";

export async function registerFCMToken() {
  try {
    // Ask permission
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Notification permission denied");
      return;
    }

    // Get token
    const token = await getToken(messaging, {
      vapidKey: "YOUR_PUBLIC_VAPID_KEY",
    });

    if (!token) {
      console.log("No token received");
      return;
    }

    console.log("FCM Token:", token);

    // Send to your Django backend
    await fetch("/api/save-fcm-token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer YOUR_ACCESS_TOKEN", // if using JWT
      },
      body: JSON.stringify({
        token: token,   // ✅ matches backend now
      }),
    });

    console.log("Token saved to backend");

  } catch (error) {
    console.error("Error getting FCM token:", error);
  }
}
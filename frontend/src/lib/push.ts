import { Platform } from "react-native";

import { API_URL } from "@/src/api/client";

// Registers the device for Emergent-managed push. No-op on web / Expo Go without
// a native build; failures are swallowed so they never block auth.
export async function registerForPush(userId: string): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const Notifications = await import("expo-notifications");
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;
    const tokenResp = await Notifications.getDevicePushTokenAsync();
    await fetch(`${API_URL}/register-push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        platform: Platform.OS,
        device_token: tokenResp.data,
      }),
    });
  } catch {
    // ignore — push is best-effort
  }
}

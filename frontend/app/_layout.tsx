import { useEffect } from "react";
import { LogBox, Platform } from "react-native";
import { Stack, useRouter } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import * as Linking from "expo-linking";
import { storage } from "@/src/utils/storage";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { queryClient } from "@/src/query-client";
import { AuthProvider } from "@/src/context/AuthContext";
import { LanguageProvider } from "@/src/context/LanguageContext";
import { ToastProvider } from "@/src/context/ToastContext";

LogBox.ignoreAllLogs(true);

// Push: foreground handler at module scope (native only).
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// Push: Android channel at module scope.
if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.MAX,
    sound: "default",
  });
}

export default function RootLayout() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    "BarlowCondensed-Bold": require("../assets/fonts/BarlowCondensed-Bold.ttf"),
    "BarlowCondensed-SemiBold": require("../assets/fonts/BarlowCondensed-SemiBold.ttf"),
    Manrope: require("../assets/fonts/Manrope-Regular.ttf"),
  });

  useEffect(() => {
    if (Platform.OS === "web") return;

    const tapSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = (response.notification.request.content.data || {}) as any;
      const url = data.deeplink || data.action_url;
      if (!url) return;
      if (url.startsWith("http")) Linking.openURL(url);
      else router.push(url);
    });

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = (response.notification.request.content.data || {}) as any;
      const url = data.deeplink || data.action_url;
      if (!url) return;
      if (url.startsWith("http")) Linking.openURL(url);
      else router.push(url);
    });

    (async () => {
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();
      if (status !== "denied" || canAskAgain) return;
      const lastNudge = await storage.getItem<number>("pushNudgeAt", 0);
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      if (lastNudge && Date.now() - Number(lastNudge) <= oneWeek) return;
      await storage.setItem("pushNudgeAt", Date.now());
    })();

    return () => tapSub.remove();
  }, [router]);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <KeyboardProvider>
              <LanguageProvider>
                <AuthProvider>
                  <ToastProvider>
                    <StatusBar style="light" />
                    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0B120F" } }} />
                  </ToastProvider>
                </AuthProvider>
              </LanguageProvider>
            </KeyboardProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

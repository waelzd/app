import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0B120F" } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="field-form" options={{ presentation: "modal" }} />
      <Stack.Screen name="tournament-form" options={{ presentation: "modal" }} />
    </Stack>
  );
}

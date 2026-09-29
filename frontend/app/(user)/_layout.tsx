import { Stack } from "expo-router";

export default function UserLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0B120F" } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="field/[id]" options={{ presentation: "card" }} />
      <Stack.Screen name="tournament/[id]" options={{ presentation: "card" }} />
      <Stack.Screen name="profile" options={{ presentation: "card" }} />
    </Stack>
  );
}

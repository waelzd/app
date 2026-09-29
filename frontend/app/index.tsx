import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/theme";

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/(auth)");
    else if (user.role === "admin") router.replace("/(admin)/(tabs)");
    else router.replace("/(user)/(tabs)");
  }, [user, loading, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ActivityIndicator size="large" color={colors.brandPrimary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
});

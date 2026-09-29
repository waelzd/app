import React from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";

import { fonts, radius, spacing, useTheme } from "@/src/theme";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  haptic = "medium",
  style,
  testID,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  haptic?: "light" | "medium" | "success" | "none";
  style?: ViewStyle;
  testID?: string;
}) {
  const { colors } = useTheme();

  const bg =
    variant === "primary"
      ? colors.brandPrimary
      : variant === "secondary"
        ? colors.surfaceTertiary
        : variant === "danger"
          ? colors.error
          : "transparent";
  const fg =
    variant === "primary"
      ? colors.onBrandPrimary
      : variant === "danger"
        ? colors.onError
        : colors.onSurface;

  const handlePress = () => {
    if (disabled || loading) return;
    if (Platform.OS !== "web" && haptic !== "none") {
      if (haptic === "success") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else Haptics.impactAsync(haptic === "light" ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        variant === "ghost" && { borderWidth: 1, borderColor: colors.borderStrong },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.text, { color: fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  text: { fontFamily: fonts.text, fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },
});

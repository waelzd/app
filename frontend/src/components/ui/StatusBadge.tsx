import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { useLang } from "@/src/context/LanguageContext";

export type StatusValue = "pending" | "approved" | "rejected";

export function StatusBadge({ status, testID }: { status: StatusValue; testID?: string }) {
  const { colors } = useTheme();
  const { t } = useLang();

  const map = {
    pending: { bg: colors.warning, fg: colors.onWarning, label: t("pending") },
    approved: { bg: colors.success, fg: colors.onSuccess, label: t("approved") },
    rejected: { bg: colors.error, fg: colors.onError, label: t("rejected") },
  }[status];

  return (
    <View testID={testID ?? `status-badge-${status}`} style={[styles.badge, { backgroundColor: map.bg }]}>
      <View style={[styles.dot, { backgroundColor: map.fg }]} />
      <Text style={[styles.text, { color: map.fg }]}>{map.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
});

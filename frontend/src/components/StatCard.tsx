import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { fonts, radius, spacing, useTheme } from "@/src/theme";

export function StatCard({
  label,
  value,
  accent = false,
  icon,
  testID,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  icon?: React.ReactNode;
  testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      testID={testID}
      style={[
        styles.card,
        {
          backgroundColor: accent ? colors.brandPrimary : colors.surfaceSecondary,
          borderColor: accent ? colors.brandPrimary : colors.border,
        },
      ]}
    >
      <View style={styles.top}>
        <Text style={[styles.label, { color: accent ? colors.onBrandPrimary : colors.muted }]} numberOfLines={1}>
          {label}
        </Text>
        {icon}
      </View>
      <Text style={[styles.value, { color: accent ? colors.onBrandPrimary : colors.onSurface }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { fontFamily: fonts.text, fontSize: 13, fontWeight: "600", flex: 1 },
  value: { fontFamily: fonts.display, fontSize: 38, lineHeight: 40 },
});

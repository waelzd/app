import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";

import { fonts, spacing, useTheme } from "@/src/theme";

export function EmptyState({
  title,
  subtitle,
  icon,
  image,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  image?: string;
}) {
  const { colors } = useTheme();
  return (
    <View testID="empty-state" style={styles.wrap}>
      {image ? (
        <Image source={{ uri: image }} style={styles.image} contentFit="cover" transition={200} />
      ) : (
        <View style={[styles.iconWrap, { backgroundColor: colors.surfaceSecondary }]}>{icon}</View>
      )}
      <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>
      {!!subtitle && <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", paddingVertical: spacing["3xl"], gap: spacing.sm },
  iconWrap: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  image: { width: 140, height: 140, borderRadius: 20, marginBottom: spacing.sm },
  title: { fontFamily: fonts.display, fontSize: 22 },
  subtitle: { fontFamily: fonts.text, fontSize: 14, textAlign: "center", maxWidth: 280, lineHeight: 20 },
});

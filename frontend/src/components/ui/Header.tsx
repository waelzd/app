import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CaretLeft, CaretRight, Translate } from "phosphor-react-native";

import { fonts, spacing, useTheme } from "@/src/theme";
import { useLang } from "@/src/context/LanguageContext";

export function Header({
  title,
  subtitle,
  showBack = false,
  showLangToggle = false,
  right,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showLangToggle?: boolean;
  right?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isRTL, toggle } = useLang();

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + spacing.sm,
          backgroundColor: colors.surface,
          borderBottomColor: colors.divider,
          flexDirection: isRTL ? "row-reverse" : "row",
        },
      ]}
    >
      {showBack && (
        <Pressable testID="header-back" onPress={() => router.back()} style={styles.iconBtn} hitSlop={10}>
          {isRTL ? (
            <CaretRight size={24} color={colors.onSurface} weight="bold" />
          ) : (
            <CaretLeft size={24} color={colors.onSurface} weight="bold" />
          )}
        </Pressable>
      )}
      <View style={{ flex: 1 }}>
        <Text
          style={[styles.title, { color: colors.onSurface, textAlign: isRTL ? "right" : "left" }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {!!subtitle && (
          <Text style={[styles.subtitle, { color: colors.muted, textAlign: isRTL ? "right" : "left" }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {right}
      {showLangToggle && (
        <Pressable testID="lang-toggle" onPress={toggle} style={styles.iconBtn} hitSlop={10}>
          <Translate size={24} color={colors.brandPrimary} weight="bold" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { padding: spacing.xs },
  title: { fontFamily: fonts.display, fontSize: 26, letterSpacing: 0.5 },
  subtitle: { fontFamily: fonts.text, fontSize: 13, marginTop: 2 },
});

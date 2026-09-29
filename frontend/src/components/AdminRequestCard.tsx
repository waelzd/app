import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Check, X } from "phosphor-react-native";
import * as Haptics from "expo-haptics";

import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { useLang } from "@/src/context/LanguageContext";
import { StatusBadge, StatusValue } from "@/src/components/ui/StatusBadge";

export function AdminRequestCard({
  title,
  subtitle,
  chips,
  status,
  onApprove,
  onReject,
  loading,
  testID,
}: {
  title: string;
  subtitle?: string;
  chips?: string[];
  status: StatusValue;
  onApprove: () => void;
  onReject: () => void;
  loading?: boolean;
  testID?: string;
}) {
  const { colors } = useTheme();
  const { t } = useLang();

  const tap = (fn: () => void, type: "success" | "warning") => () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(
        type === "success" ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
      );
    }
    fn();
  };

  return (
    <View testID={testID} style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>{title}</Text>
          {!!subtitle && <Text style={[styles.subtitle, { color: colors.muted }]} numberOfLines={1}>{subtitle}</Text>}
        </View>
        <StatusBadge status={status} />
      </View>

      {!!chips?.length && (
        <View style={styles.chips}>
          {chips.map((c, i) => (
            <View key={i} style={[styles.chip, { backgroundColor: colors.surfaceTertiary }]}>
              <Text style={[styles.chipText, { color: colors.onSurfaceTertiary }]}>{c}</Text>
            </View>
          ))}
        </View>
      )}

      {status === "pending" && (
        <View style={styles.actions}>
          <Pressable
            testID={`${testID}-reject`}
            disabled={loading}
            onPress={tap(onReject, "warning")}
            style={[styles.actionBtn, { backgroundColor: colors.surfaceTertiary }]}
          >
            <X size={18} color={colors.error} weight="bold" />
            <Text style={[styles.actionText, { color: colors.error }]}>{t("reject")}</Text>
          </Pressable>
          <Pressable
            testID={`${testID}-approve`}
            disabled={loading}
            onPress={tap(onApprove, "success")}
            style={[styles.actionBtn, { backgroundColor: colors.brandPrimary }]}
          >
            <Check size={18} color={colors.onBrandPrimary} weight="bold" />
            <Text style={[styles.actionText, { color: colors.onBrandPrimary }]}>{t("approve")}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.md, borderWidth: 1, padding: spacing.lg, gap: spacing.md },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { fontFamily: fonts.display, fontSize: 20 },
  subtitle: { fontFamily: fonts.text, fontSize: 13, marginTop: 2 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  chipText: { fontFamily: fonts.text, fontSize: 12, fontWeight: "700" },
  actions: { flexDirection: "row", gap: spacing.sm },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs, height: 44, borderRadius: radius.sm },
  actionText: { fontFamily: fonts.text, fontSize: 14, fontWeight: "800" },
});

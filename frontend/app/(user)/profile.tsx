import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { UserCircle, EnvelopeSimple, Phone, Translate, SignOut, ShieldCheck } from "phosphor-react-native";

import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { useAuth } from "@/src/context/AuthContext";
import { useLang } from "@/src/context/LanguageContext";
import { Header } from "@/src/components/ui/Header";
import { Button } from "@/src/components/ui/Button";

export default function ProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t, toggle, lang } = useLang();

  const rows = [
    { icon: <EnvelopeSimple size={20} color={colors.brandPrimary} weight="fill" />, label: t("email"), value: user?.email },
    { icon: <Phone size={20} color={colors.brandPrimary} weight="fill" />, label: t("phone"), value: user?.phone },
    { icon: <ShieldCheck size={20} color={colors.brandPrimary} weight="fill" />, label: t("role"), value: user?.role === "admin" ? t("admin") : t("user") },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <Header title={t("profile")} showBack showLangToggle />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl }}>
        <View style={styles.avatarWrap}>
          <UserCircle size={96} color={colors.brandPrimary} weight="fill" />
          <Text style={[styles.name, { color: colors.onSurface }]}>{user?.name}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          {rows.map((r, idx) => (
            <View key={r.label} style={[styles.row, idx < rows.length - 1 && { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              {r.icon}
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: colors.muted }]}>{r.label}</Text>
                <Text style={[styles.rowValue, { color: colors.onSurface }]}>{r.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable
          testID="profile-lang"
          onPress={toggle}
          style={[styles.langRow, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
        >
          <Translate size={22} color={colors.brandPrimary} weight="bold" />
          <Text style={[styles.langText, { color: colors.onSurface }]}>
            {lang === "en" ? "العربية" : "English"}
          </Text>
        </Pressable>

        <View style={{ height: spacing.lg }} />
        <Button
          testID="logout-btn"
          title={t("logout")}
          variant="danger"
          haptic="none"
          onPress={async () => {
            await logout();
            router.replace("/(auth)");
          }}
          style={{ flexDirection: "row" }}
        />
        <View style={styles.signRow}>
          <SignOut size={0} color={colors.onError} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  avatarWrap: { alignItems: "center", gap: spacing.sm, marginBottom: spacing.xl },
  name: { fontFamily: fonts.display, fontSize: 30 },
  card: { borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.lg },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.lg },
  rowLabel: { fontFamily: fonts.text, fontSize: 12, fontWeight: "600" },
  rowValue: { fontFamily: fonts.text, fontSize: 15, fontWeight: "600", marginTop: 2 },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  langText: { fontFamily: fonts.text, fontSize: 15, fontWeight: "700" },
  signRow: { height: 0 },
});

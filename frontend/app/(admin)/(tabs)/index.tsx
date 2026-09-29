import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { SignOut, Plus, CurrencyDollar, Bell, Users, SoccerBall, Trophy, Ticket, Translate } from "phosphor-react-native";

import { apiRequest } from "@/src/api/client";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { useAuth } from "@/src/context/AuthContext";
import { useLang } from "@/src/context/LanguageContext";
import { usesNativeTabs } from "@/src/navigation";
import { StatCard } from "@/src/components/StatCard";
import { formatMoney } from "@/src/lib/format";

type Stats = {
  total_fields: number;
  total_reservations: number;
  pending_reservations: number;
  approved_reservations: number;
  total_tournaments: number;
  pending_teams: number;
  total_users: number;
  revenue: number;
};

export default function AdminDashboard() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t, toggle } = useLang();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  const q = useQuery({ queryKey: ["admin-stats"], queryFn: () => apiRequest<Stats>("/admin/stats"), refetchOnMount: "always" });

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: colors.divider }]}>
        <View>
          <Text style={[styles.hi, { color: colors.muted }]}>{t("dashboard")}</Text>
          <Text style={[styles.name, { color: colors.onSurface }]}>{user?.name?.split(" ")[0] || "Admin"}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable testID="admin-lang" onPress={toggle} hitSlop={10} style={[styles.iconBtn, { backgroundColor: colors.surfaceSecondary }]}>
            <Translate size={20} color={colors.brandPrimary} weight="bold" />
          </Pressable>
          <Pressable
            testID="admin-logout"
            onPress={async () => {
              await logout();
              router.replace("/(auth)");
            }}
            hitSlop={10}
            style={[styles.iconBtn, { backgroundColor: colors.surfaceSecondary }]}
          >
            <SignOut size={20} color={colors.error} weight="bold" />
          </Pressable>
        </View>
      </View>

      {q.isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: bottomChrome + 96 }} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            <StatCard testID="stat-revenue" accent label={t("revenue")} value={formatMoney(q.data?.revenue || 0)} icon={<CurrencyDollar size={20} color={colors.onBrandPrimary} weight="bold" />} />
            <StatCard testID="stat-pending" label={t("pendingApprovals")} value={q.data?.pending_reservations || 0} icon={<Bell size={20} color={colors.warning} weight="fill" />} />
          </View>
          <View style={styles.grid}>
            <StatCard testID="stat-bookings" label={t("totalBookings")} value={q.data?.total_reservations || 0} icon={<Ticket size={20} color={colors.brandPrimary} weight="fill" />} />
            <StatCard testID="stat-teams" label={t("pendingTeams")} value={q.data?.pending_teams || 0} icon={<Users size={20} color={colors.info} weight="fill" />} />
          </View>
          <View style={styles.grid}>
            <StatCard testID="stat-fields" label={t("totalFields")} value={q.data?.total_fields || 0} icon={<SoccerBall size={20} color={colors.brandPrimary} weight="fill" />} />
            <StatCard testID="stat-tournaments" label={t("totalTournaments")} value={q.data?.total_tournaments || 0} icon={<Trophy size={20} color={colors.brandPrimary} weight="fill" />} />
          </View>
          <View style={styles.grid}>
            <StatCard testID="stat-users" label={t("totalUsers")} value={q.data?.total_users || 0} icon={<Users size={20} color={colors.brandPrimary} weight="fill" />} />
            <StatCard testID="stat-approved" label={t("approved")} value={q.data?.approved_reservations || 0} icon={<Ticket size={20} color={colors.success} weight="fill" />} />
          </View>

          <Pressable testID="dash-requests-link" onPress={() => router.push("/(admin)/(tabs)/requests")} style={[styles.link, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <Bell size={22} color={colors.warning} weight="fill" />
            <Text style={[styles.linkText, { color: colors.onSurface }]}>{t("requests")}</Text>
            {(q.data?.pending_reservations || 0) + (q.data?.pending_teams || 0) > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.error }]}>
                <Text style={[styles.badgeText, { color: colors.onError }]}>
                  {(q.data?.pending_reservations || 0) + (q.data?.pending_teams || 0)}
                </Text>
              </View>
            )}
          </Pressable>
        </ScrollView>
      )}

      {/* FAB */}
      <Pressable
        testID="fab-create-tournament"
        onPress={() => router.push("/(admin)/tournament-form")}
        style={[styles.fab, { bottom: bottomChrome + spacing.lg, backgroundColor: colors.brandPrimary }]}
      >
        <Plus size={22} color={colors.onBrandPrimary} weight="bold" />
        <Text style={[styles.fabText, { color: colors.onBrandPrimary }]}>{t("createTournament")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  hi: { fontFamily: fonts.text, fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },
  name: { fontFamily: fonts.display, fontSize: 30 },
  headerActions: { flexDirection: "row", gap: spacing.sm },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  grid: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.md },
  link: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, marginTop: spacing.sm },
  linkText: { fontFamily: fonts.text, fontSize: 16, fontWeight: "700", flex: 1 },
  badge: { minWidth: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  badgeText: { fontFamily: fonts.text, fontSize: 13, fontWeight: "800" },
  fab: { position: "absolute", right: spacing.lg, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.lg, height: 54, borderRadius: radius.pill },
  fabText: { fontFamily: fonts.display, fontSize: 20 },
});

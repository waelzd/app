import React, { useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { CalendarBlank, Clock, MapPin, Ticket, Users } from "phosphor-react-native";

import { apiRequest } from "@/src/api/client";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { useLang } from "@/src/context/LanguageContext";
import { usesNativeTabs } from "@/src/navigation";
import { Header } from "@/src/components/ui/Header";
import { Segmented } from "@/src/components/ui/Segmented";
import { StatusBadge, StatusValue } from "@/src/components/ui/StatusBadge";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { formatDate, formatMoney } from "@/src/lib/format";

type Reservation = {
  id: string;
  date: string;
  slot: string;
  price: number;
  status: StatusValue;
  note?: string;
  field?: { name?: string; location?: string };
};
type TeamReq = {
  id: string;
  team_name: string;
  players: number;
  status: StatusValue;
  note?: string;
  tournament?: { name?: string; start_date?: string };
};

export default function BookingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useLang();
  const [tab, setTab] = useState<"reservations" | "teams">("reservations");
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  const resQ = useQuery({ queryKey: ["my-reservations"], queryFn: () => apiRequest<Reservation[]>("/reservations/my") });
  const teamQ = useQuery({ queryKey: ["my-teams"], queryFn: () => apiRequest<TeamReq[]>("/team-requests/my") });

  const loading = tab === "reservations" ? resQ.isLoading : teamQ.isLoading;

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <Header title={t("bookings")} showLangToggle />
      <View style={styles.segWrap}>
        <Segmented
          testIDPrefix="bookings-tab"
          options={[
            { key: "reservations", label: t("reservations") },
            { key: "teams", label: t("myTeams") },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      ) : tab === "reservations" ? (
        <FlatList
          data={resQ.data || []}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: bottomChrome + spacing.xl }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={resQ.isRefetching} onRefresh={resQ.refetch} tintColor={colors.brandPrimary} />}
          renderItem={({ item }) => (
            <View testID={`reservation-${item.id}`} style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <View style={styles.cardTop}>
                <Text style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={1}>
                  {item.field?.name || "Field"}
                </Text>
                <StatusBadge status={item.status} />
              </View>
              <View style={styles.metaRow}>
                <MapPin size={14} color={colors.muted} weight="fill" />
                <Text style={[styles.meta, { color: colors.muted }]} numberOfLines={1}>{item.field?.location}</Text>
              </View>
              <View style={styles.chips}>
                <Chip icon={<CalendarBlank size={14} color={colors.brandPrimary} weight="fill" />} label={formatDate(item.date)} colors={colors} />
                <Chip icon={<Clock size={14} color={colors.brandPrimary} weight="fill" />} label={item.slot} colors={colors} />
                <Chip label={formatMoney(item.price)} colors={colors} />
              </View>
              {item.status === "rejected" && !!item.note && (
                <Text style={[styles.note, { color: colors.error }]}>{item.note}</Text>
              )}
            </View>
          )}
          ListEmptyComponent={
            <EmptyState title={t("noData")} subtitle="No reservations yet." icon={<Ticket size={40} color={colors.brandPrimary} weight="fill" />} />
          }
        />
      ) : (
        <FlatList
          data={teamQ.data || []}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: bottomChrome + spacing.xl }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={teamQ.isRefetching} onRefresh={teamQ.refetch} tintColor={colors.brandPrimary} />}
          renderItem={({ item }) => (
            <View testID={`team-request-${item.id}`} style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <View style={styles.cardTop}>
                <Text style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={1}>{item.team_name}</Text>
                <StatusBadge status={item.status} />
              </View>
              <Text style={[styles.meta, { color: colors.onSurfaceTertiary }]} numberOfLines={1}>
                {item.tournament?.name}
              </Text>
              <View style={styles.chips}>
                <Chip icon={<Users size={14} color={colors.brandPrimary} weight="fill" />} label={`${item.players} ${t("players")}`} colors={colors} />
                {!!item.tournament?.start_date && (
                  <Chip icon={<CalendarBlank size={14} color={colors.brandPrimary} weight="fill" />} label={formatDate(item.tournament.start_date)} colors={colors} />
                )}
              </View>
              {item.status === "rejected" && !!item.note && (
                <Text style={[styles.note, { color: colors.error }]}>{item.note}</Text>
              )}
            </View>
          )}
          ListEmptyComponent={
            <EmptyState title={t("noData")} subtitle="You haven't joined a tournament yet." icon={<Users size={40} color={colors.brandPrimary} weight="fill" />} />
          }
        />
      )}
    </View>
  );
}

function Chip({ icon, label, colors }: { icon?: React.ReactNode; label: string; colors: any }) {
  return (
    <View style={[styles.chip, { backgroundColor: colors.surfaceTertiary }]}>
      {icon}
      <Text style={[styles.chipText, { color: colors.onSurfaceTertiary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  segWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: { borderRadius: radius.md, borderWidth: 1, padding: spacing.lg, gap: spacing.sm },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  cardTitle: { fontFamily: fonts.display, fontSize: 22, flex: 1 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  meta: { fontFamily: fonts.text, fontSize: 13, flexShrink: 1 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  chipText: { fontFamily: fonts.text, fontSize: 12, fontWeight: "700" },
  note: { fontFamily: fonts.text, fontSize: 13, fontStyle: "italic", marginTop: spacing.xs },
});

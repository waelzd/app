import React, { useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "phosphor-react-native";

import { apiRequest } from "@/src/api/client";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { useLang } from "@/src/context/LanguageContext";
import { useToast } from "@/src/context/ToastContext";
import { usesNativeTabs } from "@/src/navigation";
import { Header } from "@/src/components/ui/Header";
import { Segmented } from "@/src/components/ui/Segmented";
import { AdminRequestCard } from "@/src/components/AdminRequestCard";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { StatusValue } from "@/src/components/ui/StatusBadge";
import { formatDate, formatMoney } from "@/src/lib/format";

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default function AdminRequests() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useLang();
  const toast = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"reservations" | "teams">("reservations");
  const [filter, setFilter] = useState("pending");
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  const resQ = useQuery({ queryKey: ["admin-reservations"], queryFn: () => apiRequest<any[]>("/reservations") });
  const teamQ = useQuery({ queryKey: ["admin-teams"], queryFn: () => apiRequest<any[]>("/team-requests") });

  const resMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusValue }) =>
      apiRequest(`/reservations/${id}/status`, {
        method: "PUT",
        body: { status, note: status === "rejected" ? "Not available" : "" },
      }),
    onSuccess: (_d, v) => {
      toast.show(`Reservation ${v.status}`, v.status === "approved" ? "success" : "info");
      qc.invalidateQueries({ queryKey: ["admin-reservations"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: any) => toast.show(e?.message || "Failed", "error"),
  });

  const teamMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusValue }) =>
      apiRequest(`/team-requests/${id}/status`, {
        method: "PUT",
        body: { status, note: status === "rejected" ? "Not accepted" : "" },
      }),
    onSuccess: (_d, v) => {
      toast.show(`Team request ${v.status}`, v.status === "approved" ? "success" : "info");
      qc.invalidateQueries({ queryKey: ["admin-teams"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: any) => toast.show(e?.message || "Failed", "error"),
  });

  const data = (tab === "reservations" ? resQ.data : teamQ.data) || [];
  const filtered = filter === "all" ? data : data.filter((d) => d.status === filter);
  const loading = tab === "reservations" ? resQ.isLoading : teamQ.isLoading;

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <Header title={t("requests")} showLangToggle />
      <View style={styles.controls}>
        <Segmented
          testIDPrefix="req-tab"
          options={[
            { key: "reservations", label: t("reservations") },
            { key: "teams", label: t("myTeams") },
          ]}
          value={tab}
          onChange={setTab}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow} style={styles.chipScroller}>
          {FILTERS.map((f) => {
            const active = f.key === filter;
            return (
              <Pressable
                key={f.key}
                testID={`filter-${f.key}`}
                onPress={() => setFilter(f.key)}
                style={[styles.chip, { backgroundColor: active ? colors.brandPrimary : colors.surfaceSecondary, borderColor: active ? colors.brandPrimary : colors.border }]}
              >
                <Text style={[styles.chipText, { color: active ? colors.onBrandPrimary : colors.onSurfaceTertiary }]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.md, gap: spacing.md, paddingBottom: bottomChrome + spacing.xl }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={tab === "reservations" ? resQ.isRefetching : teamQ.isRefetching}
              onRefresh={tab === "reservations" ? resQ.refetch : teamQ.refetch}
              tintColor={colors.brandPrimary}
            />
          }
          renderItem={({ item }) =>
            tab === "reservations" ? (
              <AdminRequestCard
                testID={`admin-res-${item.id}`}
                title={item.field?.name || "Field"}
                subtitle={`${item.user?.name || ""} · ${item.user?.phone || ""}`}
                chips={[formatDate(item.date), item.slot, formatMoney(item.price)]}
                status={item.status}
                loading={resMut.isPending}
                onApprove={() => resMut.mutate({ id: item.id, status: "approved" })}
                onReject={() => resMut.mutate({ id: item.id, status: "rejected" })}
              />
            ) : (
              <AdminRequestCard
                testID={`admin-team-${item.id}`}
                title={item.team_name}
                subtitle={`${item.tournament?.name || ""} · ${item.user?.name || ""}`}
                chips={[`${item.players} ${t("players")}`, item.captain_phone]}
                status={item.status}
                loading={teamMut.isPending}
                onApprove={() => teamMut.mutate({ id: item.id, status: "approved" })}
                onReject={() => teamMut.mutate({ id: item.id, status: "rejected" })}
              />
            )
          }
          ListEmptyComponent={<EmptyState title={t("noData")} subtitle="No requests here." icon={<Bell size={40} color={colors.brandPrimary} weight="fill" />} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  controls: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  chipScroller: { maxHeight: 44 },
  chipRow: { gap: spacing.sm, paddingRight: spacing.lg },
  chip: { flexShrink: 0, height: 36, paddingHorizontal: spacing.lg, borderRadius: radius.pill, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  chipText: { fontFamily: fonts.text, fontSize: 13, fontWeight: "700" },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
});

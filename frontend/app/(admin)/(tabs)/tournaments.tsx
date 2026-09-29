import React from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, PencilSimple, Trash, Trophy } from "phosphor-react-native";

import { apiRequest } from "@/src/api/client";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { useLang } from "@/src/context/LanguageContext";
import { useToast } from "@/src/context/ToastContext";
import { usesNativeTabs } from "@/src/navigation";
import { Header } from "@/src/components/ui/Header";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { TournamentCard, TournamentItem } from "@/src/components/TournamentCard";

export default function AdminTournaments() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLang();
  const toast = useToast();
  const qc = useQueryClient();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  const q = useQuery({ queryKey: ["tournaments"], queryFn: () => apiRequest<TournamentItem[]>("/tournaments") });

  const del = useMutation({
    mutationFn: (id: string) => apiRequest(`/tournaments/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.show("Tournament removed", "info");
      qc.invalidateQueries({ queryKey: ["tournaments"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: any) => toast.show(e?.message || "Failed", "error"),
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <Header title={t("tournaments")} showLangToggle />
      {q.isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      ) : (
        <FlatList
          data={q.data || []}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: bottomChrome + 96 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={q.refetch} tintColor={colors.brandPrimary} />}
          renderItem={({ item }) => (
            <View style={{ gap: spacing.sm }}>
              <TournamentCard tournament={item} onPress={() => router.push(`/(admin)/tournament-form?id=${item.id}`)} />
              <View style={styles.actions}>
                <Pressable
                  testID={`edit-tournament-${item.id}`}
                  onPress={() => router.push(`/(admin)/tournament-form?id=${item.id}`)}
                  style={[styles.actionBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                >
                  <PencilSimple size={16} color={colors.brandPrimary} weight="bold" />
                  <Text style={[styles.actionText, { color: colors.onSurface }]}>{t("editField")}</Text>
                </Pressable>
                <Pressable
                  testID={`delete-tournament-${item.id}`}
                  onPress={() => del.mutate(item.id)}
                  style={[styles.actionBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                >
                  <Trash size={16} color={colors.error} weight="bold" />
                  <Text style={[styles.actionText, { color: colors.error }]}>{t("delete")}</Text>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={<EmptyState title={t("noData")} subtitle="Create your first tournament." icon={<Trophy size={40} color={colors.brandPrimary} weight="fill" />} />}
        />
      )}

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
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  actions: { flexDirection: "row", gap: spacing.sm },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs, height: 42, borderRadius: radius.sm, borderWidth: 1 },
  actionText: { fontFamily: fonts.text, fontSize: 13, fontWeight: "700" },
  fab: { position: "absolute", right: spacing.lg, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.lg, height: 54, borderRadius: radius.pill },
  fabText: { fontFamily: fonts.display, fontSize: 20 },
});

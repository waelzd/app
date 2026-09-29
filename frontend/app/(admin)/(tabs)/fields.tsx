import React from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, PencilSimple, Trash, SoccerBall, MapPin } from "phosphor-react-native";

import { apiRequest } from "@/src/api/client";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { useLang } from "@/src/context/LanguageContext";
import { useToast } from "@/src/context/ToastContext";
import { usesNativeTabs } from "@/src/navigation";
import { Header } from "@/src/components/ui/Header";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { FieldItem } from "@/src/components/FieldCard";

const FALLBACK = "https://images.unsplash.com/photo-1546608235-3310a2494cdf?w=400&q=80";

export default function AdminFields() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLang();
  const toast = useToast();
  const qc = useQueryClient();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  const q = useQuery({ queryKey: ["fields"], queryFn: () => apiRequest<FieldItem[]>("/fields") });

  const del = useMutation({
    mutationFn: (id: string) => apiRequest(`/fields/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.show("Field removed", "info");
      qc.invalidateQueries({ queryKey: ["fields"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: any) => toast.show(e?.message || "Failed", "error"),
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <Header title={t("manageFields")} showLangToggle />
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
            <View testID={`admin-field-${item.id}`} style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Image source={{ uri: item.image_url || FALLBACK }} style={styles.image} contentFit="cover" />
              <View style={styles.body}>
                <Text style={[styles.name, { color: colors.onSurface }]} numberOfLines={1}>{item.name}</Text>
                <View style={styles.metaRow}>
                  <MapPin size={13} color={colors.muted} weight="fill" />
                  <Text style={[styles.meta, { color: colors.muted }]} numberOfLines={1}>{item.location}</Text>
                </View>
                <Text style={[styles.price, { color: colors.brandPrimary }]}>${item.price_per_hour}{t("pricePerHour")}</Text>
              </View>
              <View style={styles.actions}>
                <Pressable
                  testID={`edit-field-${item.id}`}
                  onPress={() => router.push(`/(admin)/field-form?id=${item.id}`)}
                  style={[styles.iconBtn, { backgroundColor: colors.surfaceTertiary }]}
                >
                  <PencilSimple size={18} color={colors.brandPrimary} weight="bold" />
                </Pressable>
                <Pressable
                  testID={`delete-field-${item.id}`}
                  onPress={() => del.mutate(item.id)}
                  style={[styles.iconBtn, { backgroundColor: colors.surfaceTertiary }]}
                >
                  <Trash size={18} color={colors.error} weight="bold" />
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={<EmptyState title={t("noData")} subtitle="Add your first field." icon={<SoccerBall size={40} color={colors.brandPrimary} weight="fill" />} />}
        />
      )}

      <Pressable
        testID="fab-add-field"
        onPress={() => router.push("/(admin)/field-form")}
        style={[styles.fab, { bottom: bottomChrome + spacing.lg, backgroundColor: colors.brandPrimary }]}
      >
        <Plus size={22} color={colors.onBrandPrimary} weight="bold" />
        <Text style={[styles.fabText, { color: colors.onBrandPrimary }]}>{t("addField")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: { flexDirection: "row", borderRadius: radius.md, borderWidth: 1, overflow: "hidden", alignItems: "center" },
  image: { width: 84, height: 84 },
  body: { flex: 1, padding: spacing.md, gap: 2 },
  name: { fontFamily: fonts.display, fontSize: 20 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  meta: { fontFamily: fonts.text, fontSize: 12, flexShrink: 1 },
  price: { fontFamily: fonts.text, fontSize: 14, fontWeight: "700", marginTop: 2 },
  actions: { flexDirection: "row", gap: spacing.sm, paddingRight: spacing.md },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  fab: { position: "absolute", right: spacing.lg, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.lg, height: 54, borderRadius: radius.pill },
  fabText: { fontFamily: fonts.display, fontSize: 20 },
});

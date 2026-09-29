import React from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { SoccerBall } from "phosphor-react-native";

import { apiRequest } from "@/src/api/client";
import { spacing, useTheme } from "@/src/theme";
import { useLang } from "@/src/context/LanguageContext";
import { usesNativeTabs } from "@/src/navigation";
import { Header } from "@/src/components/ui/Header";
import { FieldCard, FieldItem } from "@/src/components/FieldCard";
import { EmptyState } from "@/src/components/ui/EmptyState";

export default function FieldsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLang();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  const q = useQuery({ queryKey: ["fields"], queryFn: () => apiRequest<FieldItem[]>("/fields") });

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <Header title={t("fields")} subtitle={t("nearbyFields")} showLangToggle />
      {q.isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      ) : (
        <FlatList
          data={q.data || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: bottomChrome + spacing.xl }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={q.isRefetching} onRefresh={q.refetch} tintColor={colors.brandPrimary} />
          }
          renderItem={({ item }) => (
            <FieldCard field={item} onPress={() => router.push(`/(user)/field/${item.id}`)} />
          )}
          ListEmptyComponent={
            <EmptyState
              title={t("noData")}
              subtitle="No fields available yet."
              icon={<SoccerBall size={40} color={colors.brandPrimary} weight="fill" />}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
});

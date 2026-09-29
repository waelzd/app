import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { UserCircle, ArrowRight, SoccerBall } from "phosphor-react-native";

import { apiRequest } from "@/src/api/client";
import { fonts, spacing, radius, useTheme } from "@/src/theme";
import { useAuth } from "@/src/context/AuthContext";
import { useLang } from "@/src/context/LanguageContext";
import { usesNativeTabs } from "@/src/navigation";
import { FieldCard, FieldItem } from "@/src/components/FieldCard";
import { TournamentCard, TournamentItem } from "@/src/components/TournamentCard";
import { EmptyState } from "@/src/components/ui/EmptyState";

export default function UserHome() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { t, isRTL } = useLang();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  const fieldsQ = useQuery({ queryKey: ["fields"], queryFn: () => apiRequest<FieldItem[]>("/fields") });
  const tQ = useQuery({ queryKey: ["tournaments"], queryFn: () => apiRequest<TournamentItem[]>("/tournaments") });

  const loading = fieldsQ.isLoading || tQ.isLoading;

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      {/* Sticky header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + spacing.sm, borderBottomColor: colors.divider, flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        <View>
          <Text style={[styles.hi, { color: colors.muted, textAlign: isRTL ? "right" : "left" }]}>{t("discover")}</Text>
          <Text style={[styles.name, { color: colors.onSurface, textAlign: isRTL ? "right" : "left" }]}>
            {user?.name?.split(" ")[0] || "Player"}
          </Text>
        </View>
        <Pressable testID="profile-btn" onPress={() => router.push("/(user)/profile")} hitSlop={10}>
          <UserCircle size={40} color={colors.brandPrimary} weight="fill" />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: bottomChrome + spacing.xl }}
          showsVerticalScrollIndicator={false}
        >
          {/* Featured tournaments */}
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>{t("featuredTournaments")}</Text>
            <Pressable onPress={() => router.push("/(user)/(tabs)/tournaments")}>
              <Text style={[styles.viewAll, { color: colors.brandPrimary }]}>{t("viewAll")}</Text>
            </Pressable>
          </View>
          {tQ.data && tQ.data.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
            >
              {tQ.data.slice(0, 6).map((item) => (
                <TournamentCard
                  key={item.id}
                  tournament={item}
                  wide
                  onPress={() => router.push(`/(user)/tournament/${item.id}`)}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.mini, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Trophy_ colors={colors} />
              <Text style={[styles.miniText, { color: colors.muted }]}>{t("noData")}</Text>
            </View>
          )}

          {/* Nearby fields */}
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>{t("nearbyFields")}</Text>
            <Pressable onPress={() => router.push("/(user)/(tabs)/fields")}>
              <Text style={[styles.viewAll, { color: colors.brandPrimary }]}>{t("viewAll")}</Text>
            </Pressable>
          </View>

          {fieldsQ.data && fieldsQ.data.length > 0 ? (
            <View style={styles.fieldsList}>
              {fieldsQ.data.slice(0, 5).map((f) => (
                <FieldCard key={f.id} field={f} onPress={() => router.push(`/(user)/field/${f.id}`)} />
              ))}
            </View>
          ) : (
            <EmptyState
              title={t("noData")}
              subtitle="No fields available yet. Check back soon!"
              icon={<SoccerBall size={40} color={colors.brandPrimary} weight="fill" />}
            />
          )}

          {/* Book CTA */}
          <Pressable
            testID="home-book-cta"
            onPress={() => router.push("/(user)/(tabs)/fields")}
            style={({ pressed }) => [styles.cta, { backgroundColor: colors.brandPrimary, opacity: pressed ? 0.9 : 1 }]}
          >
            <Text style={[styles.ctaText, { color: colors.onBrandPrimary }]}>{t("bookField")}</Text>
            <ArrowRight size={20} color={colors.onBrandPrimary} weight="bold" />
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

function Trophy_({ colors }: { colors: any }) {
  return <SoccerBall size={28} color={colors.muted} weight="fill" />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  hi: { fontFamily: fonts.text, fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },
  name: { fontFamily: fonts.display, fontSize: 30 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontFamily: fonts.display, fontSize: 24 },
  viewAll: { fontFamily: fonts.text, fontSize: 13, fontWeight: "700" },
  fieldsList: { paddingHorizontal: spacing.lg, gap: spacing.md },
  mini: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  miniText: { fontFamily: fonts.text, fontSize: 14 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    height: 56,
    borderRadius: radius.md,
  },
  ctaText: { fontFamily: fonts.display, fontSize: 22, letterSpacing: 0.5 },
});

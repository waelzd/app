import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Trophy, Users, Calendar } from "phosphor-react-native";

import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { formatDate } from "@/src/lib/format";

const FALLBACK = "https://images.unsplash.com/photo-1556764420-e37ef4cdfa5c?w=800&q=80";

export type TournamentItem = {
  id: string;
  name: string;
  location: string;
  image_url?: string;
  start_date: string;
  max_teams: number;
  entry_fee: number;
  prize?: string;
  teams_count?: number;
};

export function TournamentCard({
  tournament,
  onPress,
  wide = false,
}: {
  tournament: TournamentItem;
  onPress: () => void;
  wide?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={`tournament-card-${tournament.id}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, wide ? styles.wide : styles.full, { opacity: pressed ? 0.92 : 1 }]}
    >
      <Image source={{ uri: tournament.image_url || FALLBACK }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      <LinearGradient colors={["transparent", "rgba(11,18,15,0.5)", colors.surface]} style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        {!!tournament.prize && (
          <View style={[styles.prizeTag, { backgroundColor: colors.brandPrimary }]}>
            <Trophy size={13} color={colors.onBrandPrimary} weight="fill" />
            <Text style={[styles.prizeText, { color: colors.onBrandPrimary }]} numberOfLines={1}>
              {tournament.prize}
            </Text>
          </View>
        )}
        <Text style={[styles.name, { color: colors.onSurface }]} numberOfLines={2}>
          {tournament.name}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.meta}>
            <Calendar size={14} color={colors.brandPrimary} weight="fill" />
            <Text style={[styles.metaText, { color: colors.onSurfaceSecondary }]}>{formatDate(tournament.start_date)}</Text>
          </View>
          <View style={styles.meta}>
            <Users size={14} color={colors.brandPrimary} weight="fill" />
            <Text style={[styles.metaText, { color: colors.onSurfaceSecondary }]}>
              {tournament.teams_count ?? 0}/{tournament.max_teams}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, overflow: "hidden", justifyContent: "flex-end" },
  wide: { width: 280, height: 180 },
  full: { width: "100%", height: 190 },
  content: { padding: spacing.lg, gap: spacing.xs },
  prizeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.xs,
  },
  prizeText: { fontFamily: fonts.text, fontSize: 11, fontWeight: "800", maxWidth: 160 },
  name: { fontFamily: fonts.display, fontSize: 26, lineHeight: 28 },
  metaRow: { flexDirection: "row", gap: spacing.lg, marginTop: 2 },
  meta: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  metaText: { fontFamily: fonts.text, fontSize: 13, fontWeight: "600" },
});

import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CaretLeft, MapPin, CalendarBlank, Users, Trophy, CurrencyDollar } from "phosphor-react-native";

import { apiRequest } from "@/src/api/client";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { useLang } from "@/src/context/LanguageContext";
import { useToast } from "@/src/context/ToastContext";
import { Button } from "@/src/components/ui/Button";
import { TextField } from "@/src/components/ui/TextField";
import { StatusBadge, StatusValue } from "@/src/components/ui/StatusBadge";
import { formatDate } from "@/src/lib/format";

type Tournament = {
  id: string;
  name: string;
  location: string;
  description?: string;
  image_url?: string;
  start_date: string;
  max_teams: number;
  entry_fee: number;
  prize?: string;
  teams_count?: number;
  my_request?: { status: StatusValue; team_name: string } | null;
};

export default function TournamentDetail() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLang();
  const toast = useToast();
  const qc = useQueryClient();

  const [teamName, setTeamName] = useState("");
  const [players, setPlayers] = useState("7");

  const q = useQuery({ queryKey: ["tournament", id], queryFn: () => apiRequest<Tournament>(`/tournaments/${id}`) });

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest(`/tournaments/${id}/join`, {
        method: "POST",
        body: { team_name: teamName.trim(), players: parseInt(players, 10) || 7 },
      }),
    onSuccess: () => {
      toast.show("Join request submitted! Awaiting approval.", "success");
      qc.invalidateQueries({ queryKey: ["tournament", id] });
      qc.invalidateQueries({ queryKey: ["my-teams"] });
      router.push("/(user)/(tabs)/bookings");
    },
    onError: (e: any) => toast.show(e?.message || "Could not join", "error"),
  });

  if (q.isLoading || !q.data) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  const item = q.data;
  const info = [
    { icon: <CalendarBlank size={18} color={colors.brandPrimary} weight="fill" />, label: t("startDate"), value: formatDate(item.start_date) },
    { icon: <MapPin size={18} color={colors.brandPrimary} weight="fill" />, label: t("location"), value: item.location },
    { icon: <Users size={18} color={colors.brandPrimary} weight="fill" />, label: t("teams"), value: `${item.teams_count ?? 0}/${item.max_teams}` },
    { icon: <CurrencyDollar size={18} color={colors.brandPrimary} weight="fill" />, label: t("entryFee"), value: `$${item.entry_fee}` },
  ];

  const submit = () => {
    if (teamName.trim().length < 2) {
      toast.show("Enter a team name", "error");
      return;
    }
    mutation.mutate();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <KeyboardAwareScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }} bottomOffset={20}>
        <View style={styles.cover}>
          <Image
            source={{ uri: item.image_url || "https://images.unsplash.com/photo-1556764420-e37ef4cdfa5c?w=1000&q=80" }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <LinearGradient colors={["rgba(11,18,15,0.4)", "transparent", colors.surface]} style={StyleSheet.absoluteFill} />
          <Pressable
            testID="tournament-back"
            onPress={() => router.back()}
            style={[styles.backBtn, { top: insets.top + spacing.sm, backgroundColor: colors.surfaceSecondary }]}
            hitSlop={10}
          >
            <CaretLeft size={22} color={colors.onSurface} weight="bold" />
          </Pressable>
          <View style={styles.coverText}>
            {!!item.prize && (
              <View style={[styles.prizeTag, { backgroundColor: colors.brandPrimary }]}>
                <Trophy size={14} color={colors.onBrandPrimary} weight="fill" />
                <Text style={[styles.prizeText, { color: colors.onBrandPrimary }]}>{item.prize}</Text>
              </View>
            )}
            <Text style={[styles.title, { color: colors.onSurface }]}>{item.name}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.infoGrid}>
            {info.map((r) => (
              <View key={r.label} style={[styles.infoCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                {r.icon}
                <Text style={[styles.infoLabel, { color: colors.muted }]}>{r.label}</Text>
                <Text style={[styles.infoValue, { color: colors.onSurface }]} numberOfLines={1}>{r.value}</Text>
              </View>
            ))}
          </View>

          {!!item.description && <Text style={[styles.desc, { color: colors.onSurfaceTertiary }]}>{item.description}</Text>}

          {item.my_request ? (
            <View style={[styles.joinedCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Text style={[styles.joinedTitle, { color: colors.onSurface }]}>{t("alreadyJoined")}</Text>
              <Text style={[styles.joinedTeam, { color: colors.muted }]}>{item.my_request.team_name}</Text>
              <StatusBadge status={item.my_request.status} />
            </View>
          ) : (
            <>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>{t("joinTournament")}</Text>
              <TextField testID="input-team-name" label={t("teamName")} value={teamName} onChangeText={setTeamName} placeholder="FC Beirut" />
              <TextField testID="input-players" label={t("players")} value={players} onChangeText={setPlayers} keyboardType="number-pad" placeholder="7" />
              <Button testID="submit-join" title={t("submitRequest")} onPress={submit} loading={mutation.isPending} haptic="success" />
            </>
          )}
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  cover: { height: 280, justifyContent: "flex-end" },
  backBtn: { position: "absolute", left: spacing.lg, width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  coverText: { padding: spacing.lg, gap: spacing.sm },
  prizeTag: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.pill },
  prizeText: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800" },
  title: { fontFamily: fonts.display, fontSize: 36, lineHeight: 38 },
  body: { paddingHorizontal: spacing.lg, gap: spacing.md },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  infoCard: { width: "48%", flexGrow: 1, borderRadius: radius.md, borderWidth: 1, padding: spacing.md, gap: 4 },
  infoLabel: { fontFamily: fonts.text, fontSize: 12, fontWeight: "600", marginTop: spacing.xs },
  infoValue: { fontFamily: fonts.text, fontSize: 15, fontWeight: "700" },
  desc: { fontFamily: fonts.text, fontSize: 14, lineHeight: 21 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 24, marginTop: spacing.sm },
  joinedCard: { borderRadius: radius.md, borderWidth: 1, padding: spacing.lg, gap: spacing.sm, alignItems: "flex-start", marginTop: spacing.sm },
  joinedTitle: { fontFamily: fonts.display, fontSize: 22 },
  joinedTeam: { fontFamily: fonts.text, fontSize: 14 },
});

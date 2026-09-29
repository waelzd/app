import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "phosphor-react-native";

import { apiRequest } from "@/src/api/client";
import { fonts, spacing, useTheme } from "@/src/theme";
import { useLang } from "@/src/context/LanguageContext";
import { useToast } from "@/src/context/ToastContext";
import { Button } from "@/src/components/ui/Button";
import { TextField } from "@/src/components/ui/TextField";

export default function TournamentForm() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { t } = useLang();
  const toast = useToast();
  const qc = useQueryClient();
  const editing = !!id;

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [maxTeams, setMaxTeams] = useState("16");
  const [entryFee, setEntryFee] = useState("0");
  const [prize, setPrize] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const existing = useQuery({
    queryKey: ["tournament", id],
    queryFn: () => apiRequest<any>(`/tournaments/${id}`),
    enabled: editing,
  });

  useEffect(() => {
    if (existing.data) {
      const x = existing.data;
      setName(x.name || "");
      setLocation(x.location || "");
      setDescription(x.description || "");
      setStartDate(x.start_date || "");
      setMaxTeams(String(x.max_teams ?? 16));
      setEntryFee(String(x.entry_fee ?? 0));
      setPrize(x.prize || "");
      setImageUrl(x.image_url || "");
    }
  }, [existing.data]);

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        name: name.trim(),
        location: location.trim(),
        description: description.trim(),
        start_date: startDate.trim(),
        max_teams: parseInt(maxTeams, 10) || 16,
        entry_fee: parseFloat(entryFee) || 0,
        prize: prize.trim(),
        image_url: imageUrl.trim(),
      };
      return editing
        ? apiRequest(`/tournaments/${id}`, { method: "PUT", body })
        : apiRequest("/tournaments", { method: "POST", body });
    },
    onSuccess: () => {
      toast.show(editing ? "Tournament updated" : "Tournament created", "success");
      qc.invalidateQueries({ queryKey: ["tournaments"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      router.back();
    },
    onError: (e: any) => toast.show(e?.message || "Failed", "error"),
  });

  const submit = () => {
    if (name.trim().length < 2 || location.trim().length < 2 || !startDate.trim()) {
      toast.show("Name, location and start date are required", "error");
      return;
    }
    mutation.mutate();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface, paddingTop: insets.top + spacing.sm }]}>
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <Text style={[styles.title, { color: colors.onSurface }]}>{t("createTournament")}</Text>
        <Pressable testID="close-form" onPress={() => router.back()} hitSlop={10} style={[styles.closeBtn, { backgroundColor: colors.surfaceSecondary }]}>
          <X size={20} color={colors.onSurface} weight="bold" />
        </Pressable>
      </View>
      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl }}
        showsVerticalScrollIndicator={false}
        bottomOffset={20}
      >
        <TextField testID="t-name" label="Name" value={name} onChangeText={setName} placeholder="Summer Cup 2026" />
        <TextField testID="t-location" label={t("location")} value={location} onChangeText={setLocation} placeholder="Beirut" />
        <TextField testID="t-start" label={`${t("startDate")} (YYYY-MM-DD)`} value={startDate} onChangeText={setStartDate} placeholder="2026-08-01" autoCapitalize="none" />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <TextField testID="t-max" label={t("maxTeams")} value={maxTeams} onChangeText={setMaxTeams} keyboardType="number-pad" placeholder="16" />
          </View>
          <View style={{ flex: 1 }}>
            <TextField testID="t-fee" label={t("entryFee")} value={entryFee} onChangeText={setEntryFee} keyboardType="decimal-pad" prefix="$" placeholder="0" />
          </View>
        </View>
        <TextField testID="t-prize" label={t("prize")} value={prize} onChangeText={setPrize} placeholder="$5,000" />
        <TextField testID="t-image" label={t("imageUrl")} value={imageUrl} onChangeText={setImageUrl} autoCapitalize="none" placeholder="https://..." />
        <TextField testID="t-description" label={t("description")} value={description} onChangeText={setDescription} placeholder="..." multiline style={{ height: 90, textAlignVertical: "top" }} />
        <View style={{ height: spacing.md }} />
        <Button testID="save-tournament" title={t("save")} onPress={submit} loading={mutation.isPending} haptic="success" />
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontFamily: fonts.display, fontSize: 26 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", gap: spacing.md },
});

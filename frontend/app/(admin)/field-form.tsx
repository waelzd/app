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

export default function FieldForm() {
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
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [size, setSize] = useState("");
  const [amenities, setAmenities] = useState("");

  const existing = useQuery({
    queryKey: ["field", id],
    queryFn: () => apiRequest<any>(`/fields/${id}`),
    enabled: editing,
  });

  useEffect(() => {
    if (existing.data) {
      const f = existing.data;
      setName(f.name || "");
      setLocation(f.location || "");
      setDescription(f.description || "");
      setPrice(String(f.price_per_hour ?? ""));
      setImageUrl(f.image_url || "");
      setSize(f.size || "");
      setAmenities((f.amenities || []).join(", "));
    }
  }, [existing.data]);

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        name: name.trim(),
        location: location.trim(),
        description: description.trim(),
        price_per_hour: parseFloat(price) || 0,
        image_url: imageUrl.trim(),
        size: size.trim(),
        amenities: amenities.split(",").map((a) => a.trim()).filter(Boolean),
      };
      return editing
        ? apiRequest(`/fields/${id}`, { method: "PUT", body })
        : apiRequest("/fields", { method: "POST", body });
    },
    onSuccess: () => {
      toast.show(editing ? "Field updated" : "Field added", "success");
      qc.invalidateQueries({ queryKey: ["fields"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      router.back();
    },
    onError: (e: any) => toast.show(e?.message || "Failed", "error"),
  });

  const submit = () => {
    if (name.trim().length < 2 || location.trim().length < 2 || !price) {
      toast.show("Name, location and price are required", "error");
      return;
    }
    mutation.mutate();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface, paddingTop: insets.top + spacing.sm }]}>
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <Text style={[styles.title, { color: colors.onSurface }]}>{editing ? t("editField") : t("addField")}</Text>
        <Pressable testID="close-form" onPress={() => router.back()} hitSlop={10} style={[styles.closeBtn, { backgroundColor: colors.surfaceSecondary }]}>
          <X size={20} color={colors.onSurface} weight="bold" />
        </Pressable>
      </View>
      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl }}
        showsVerticalScrollIndicator={false}
        bottomOffset={20}
      >
        <TextField testID="field-name" label={t("fieldName")} value={name} onChangeText={setName} placeholder="City Arena" />
        <TextField testID="field-location" label={t("location")} value={location} onChangeText={setLocation} placeholder="Beirut, Hamra" />
        <TextField testID="field-price" label={t("price")} value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="50" prefix="$" />
        <TextField testID="field-size" label={t("size")} value={size} onChangeText={setSize} placeholder="5-a-side" />
        <TextField testID="field-image" label={t("imageUrl")} value={imageUrl} onChangeText={setImageUrl} autoCapitalize="none" placeholder="https://..." />
        <TextField testID="field-amenities" label={t("amenities")} value={amenities} onChangeText={setAmenities} placeholder="Lighting, Parking, Showers" />
        <TextField testID="field-description" label={t("description")} value={description} onChangeText={setDescription} placeholder="..." multiline style={{ height: 90, textAlignVertical: "top" }} />
        <View style={{ height: spacing.md }} />
        <Button testID="save-field" title={t("save")} onPress={submit} loading={mutation.isPending} haptic="success" />
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontFamily: fonts.display, fontSize: 26 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});

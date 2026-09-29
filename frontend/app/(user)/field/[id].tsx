import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CaretLeft, MapPin, CheckCircle } from "phosphor-react-native";

import { apiRequest } from "@/src/api/client";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { useLang } from "@/src/context/LanguageContext";
import { useToast } from "@/src/context/ToastContext";
import { Button } from "@/src/components/ui/Button";
import { HOURLY_SLOTS, nextDays } from "@/src/lib/format";

const DAYS = nextDays(14);

type Field = {
  id: string;
  name: string;
  location: string;
  description?: string;
  price_per_hour: number;
  image_url?: string;
  amenities?: string[];
  size?: string;
};

export default function FieldDetail() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, isRTL } = useLang();
  const toast = useToast();
  const qc = useQueryClient();

  const [date, setDate] = useState(DAYS[0].key);
  const [slot, setSlot] = useState<string | null>(null);

  const fieldQ = useQuery({ queryKey: ["field", id], queryFn: () => apiRequest<Field>(`/fields/${id}`) });
  const slotsQ = useQuery({
    queryKey: ["slots", id, date],
    queryFn: () => apiRequest<{ booked: string[] }>(`/fields/${id}/slots?date=${date}`),
  });

  const booked = slotsQ.data?.booked || [];

  const mutation = useMutation({
    mutationFn: () => apiRequest("/reservations", { method: "POST", body: { field_id: id, date, slot } }),
    onSuccess: () => {
      toast.show("Booking request sent! Awaiting approval.", "success");
      qc.invalidateQueries({ queryKey: ["my-reservations"] });
      qc.invalidateQueries({ queryKey: ["slots", id, date] });
      router.push("/(user)/(tabs)/bookings");
    },
    onError: (e: any) => toast.show(e?.message || "Could not book", "error"),
  });

  if (fieldQ.isLoading || !fieldQ.data) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  const field = fieldQ.data;

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Cover */}
        <View style={styles.cover}>
          <Image
            source={{ uri: field.image_url || "https://images.unsplash.com/photo-1546608235-3310a2494cdf?w=1000&q=80" }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <LinearGradient colors={["rgba(11,18,15,0.5)", "transparent", colors.surface]} style={StyleSheet.absoluteFill} />
          <Pressable
            testID="field-back"
            onPress={() => router.back()}
            style={[styles.backBtn, { top: insets.top + spacing.sm, backgroundColor: colors.surfaceSecondary }]}
            hitSlop={10}
          >
            <CaretLeft size={22} color={colors.onSurface} weight="bold" />
          </Pressable>
          <View style={styles.coverText}>
            <Text style={[styles.title, { color: colors.onSurface }]}>{field.name}</Text>
            <View style={styles.metaRow}>
              <MapPin size={16} color={colors.brandPrimary} weight="fill" />
              <Text style={[styles.location, { color: colors.onSurfaceSecondary }]}>{field.location}</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={[styles.priceCard, { backgroundColor: colors.brandTertiary }]}>
            <Text style={[styles.priceValue, { color: colors.brandPrimary }]}>${field.price_per_hour}</Text>
            <Text style={[styles.priceLabel, { color: colors.onBrandTertiary }]}>{t("pricePerHour")}</Text>
            {!!field.size && (
              <View style={[styles.sizeTag, { backgroundColor: colors.brandPrimary }]}>
                <Text style={[styles.sizeText, { color: colors.onBrandPrimary }]}>{field.size}</Text>
              </View>
            )}
          </View>

          {!!field.description && (
            <Text style={[styles.desc, { color: colors.onSurfaceTertiary }]}>{field.description}</Text>
          )}

          {!!field.amenities?.length && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>{t("amenities")}</Text>
              <View style={styles.amenities}>
                {field.amenities.map((a) => (
                  <View key={a} style={[styles.amenity, { backgroundColor: colors.surfaceTertiary }]}>
                    <CheckCircle size={14} color={colors.success} weight="fill" />
                    <Text style={[styles.amenityText, { color: colors.onSurfaceTertiary }]}>{a}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Date picker */}
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>{t("selectDate")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {DAYS.map((d) => {
              const active = d.key === date;
              return (
                <Pressable
                  key={d.key}
                  testID={`date-${d.key}`}
                  onPress={() => {
                    setDate(d.key);
                    setSlot(null);
                  }}
                  style={[
                    styles.dateChip,
                    { backgroundColor: active ? colors.brandPrimary : colors.surfaceSecondary, borderColor: active ? colors.brandPrimary : colors.border },
                  ]}
                >
                  <Text style={[styles.dayName, { color: active ? colors.onBrandPrimary : colors.muted }]}>{d.weekday}</Text>
                  <Text style={[styles.dayNum, { color: active ? colors.onBrandPrimary : colors.onSurface }]}>{d.day}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Time slots */}
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>{t("selectTime")}</Text>
          {slotsQ.isLoading ? (
            <ActivityIndicator color={colors.brandPrimary} style={{ marginVertical: spacing.lg }} />
          ) : (
            <View style={styles.slots}>
              {HOURLY_SLOTS.map((s) => {
                const isBooked = booked.includes(s);
                const active = s === slot;
                return (
                  <Pressable
                    key={s}
                    testID={`slot-${s}`}
                    disabled={isBooked}
                    onPress={() => setSlot(s)}
                    style={[
                      styles.slot,
                      {
                        backgroundColor: isBooked ? colors.surface : active ? colors.brandPrimary : colors.surfaceSecondary,
                        borderColor: active ? colors.brandPrimary : colors.border,
                        opacity: isBooked ? 0.4 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.slotText,
                        { color: isBooked ? colors.muted : active ? colors.onBrandPrimary : colors.onSurface },
                      ]}
                    >
                      {s}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + spacing.md, backgroundColor: colors.surface, borderTopColor: colors.divider, flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        <Button
          testID="confirm-booking"
          title={slot ? `${t("confirmBooking")} · ${slot}` : t("selectTime")}
          onPress={() => mutation.mutate()}
          loading={mutation.isPending}
          disabled={!slot}
          haptic="success"
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  cover: { height: 300, justifyContent: "flex-end" },
  backBtn: { position: "absolute", left: spacing.lg, width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  coverText: { padding: spacing.lg, gap: spacing.xs },
  title: { fontFamily: fonts.display, fontSize: 38, lineHeight: 40 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  location: { fontFamily: fonts.text, fontSize: 15, fontWeight: "600" },
  body: { paddingHorizontal: spacing.lg, gap: spacing.md },
  priceCard: { flexDirection: "row", alignItems: "baseline", padding: spacing.lg, borderRadius: radius.md, gap: spacing.xs },
  priceValue: { fontFamily: fonts.display, fontSize: 40 },
  priceLabel: { fontFamily: fonts.text, fontSize: 14, fontWeight: "600" },
  sizeTag: { marginLeft: "auto", paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, alignSelf: "center" },
  sizeText: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800" },
  desc: { fontFamily: fonts.text, fontSize: 14, lineHeight: 21 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 22, marginTop: spacing.sm },
  amenities: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  amenity: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill },
  amenityText: { fontFamily: fonts.text, fontSize: 13, fontWeight: "600" },
  dateChip: { width: 60, height: 72, borderRadius: radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center", gap: 2 },
  dayName: { fontFamily: fonts.text, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  dayNum: { fontFamily: fonts.display, fontSize: 24 },
  slots: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  slot: { width: "22.5%", height: 46, borderRadius: radius.sm, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  slotText: { fontFamily: fonts.text, fontSize: 14, fontWeight: "700" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

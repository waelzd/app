import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { MapPin, CurrencyDollar, Ruler } from "phosphor-react-native";

import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { useLang } from "@/src/context/LanguageContext";

const FALLBACK = "https://images.unsplash.com/photo-1546608235-3310a2494cdf?w=600&q=80";

export type FieldItem = {
  id: string;
  name: string;
  location: string;
  price_per_hour: number;
  image_url?: string;
  size?: string;
};

export function FieldCard({ field, onPress }: { field: FieldItem; onPress: () => void }) {
  const { colors } = useTheme();
  const { t } = useLang();
  return (
    <Pressable
      testID={`field-card-${field.id}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <Image
        source={{ uri: field.image_url || FALLBACK }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.body}>
        <Text style={[styles.name, { color: colors.onSurface }]} numberOfLines={1}>
          {field.name}
        </Text>
        <View style={styles.row}>
          <MapPin size={14} color={colors.muted} weight="fill" />
          <Text style={[styles.meta, { color: colors.muted }]} numberOfLines={1}>
            {field.location}
          </Text>
        </View>
        <View style={styles.bottom}>
          {!!field.size && (
            <View style={styles.row}>
              <Ruler size={14} color={colors.onSurfaceTertiary} weight="bold" />
              <Text style={[styles.meta, { color: colors.onSurfaceTertiary }]}>{field.size}</Text>
            </View>
          )}
          <View style={styles.priceWrap}>
            <CurrencyDollar size={16} color={colors.brandPrimary} weight="bold" />
            <Text style={[styles.price, { color: colors.brandPrimary }]}>{field.price_per_hour}</Text>
            <Text style={[styles.perHour, { color: colors.muted }]}>{t("pricePerHour")}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", borderRadius: radius.md, borderWidth: 1, overflow: "hidden" },
  image: { width: 110, height: 110 },
  body: { flex: 1, padding: spacing.md, justifyContent: "space-between" },
  name: { fontFamily: fonts.display, fontSize: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  meta: { fontFamily: fonts.text, fontSize: 13, flexShrink: 1 },
  bottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  priceWrap: { flexDirection: "row", alignItems: "center" },
  price: { fontFamily: fonts.display, fontSize: 22 },
  perHour: { fontFamily: fonts.text, fontSize: 11, marginLeft: 2 },
});

import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

import { fonts, radius, useTheme } from "@/src/theme";

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  testIDPrefix,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  testIDPrefix?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.surfaceTertiary }]}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            testID={testIDPrefix ? `${testIDPrefix}-${opt.key}` : undefined}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.selectionAsync();
              onChange(opt.key);
            }}
            style={[styles.seg, active && { backgroundColor: colors.brandPrimary }]}
          >
            <Text
              style={[
                styles.label,
                { color: active ? colors.onBrandPrimary : colors.onSurfaceTertiary },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", padding: 4, borderRadius: radius.md, gap: 4 },
  seg: {
    flex: 1,
    height: 40,
    borderRadius: radius.sm + 2,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontFamily: fonts.text, fontSize: 14, fontWeight: "700" },
});

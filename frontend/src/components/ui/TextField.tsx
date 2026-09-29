import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { useLang } from "@/src/context/LanguageContext";

export function TextField({
  label,
  error,
  prefix,
  style,
  testID,
  ...props
}: TextInputProps & { label?: string; error?: string; prefix?: string; testID?: string }) {
  const { colors } = useTheme();
  const { isRTL } = useLang();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      {!!label && (
        <Text style={[styles.label, { color: colors.onSurfaceTertiary, textAlign: isRTL ? "right" : "left" }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.surfaceTertiary,
            borderColor: error ? colors.error : focused ? colors.brandPrimary : colors.border,
            flexDirection: isRTL ? "row-reverse" : "row",
          },
        ]}
      >
        {!!prefix && <Text style={[styles.prefix, { color: colors.muted }]}>{prefix}</Text>}
        <TextInput
          testID={testID}
          placeholderTextColor={colors.muted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            { color: colors.onSurface, textAlign: isRTL ? "right" : "left" },
            style as any,
          ]}
          {...props}
        />
      </View>
      {!!error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md, gap: spacing.xs },
  label: { fontFamily: fonts.text, fontSize: 13, fontWeight: "600" },
  inputRow: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  prefix: { fontFamily: fonts.text, fontSize: 15, fontWeight: "700", marginHorizontal: spacing.xs },
  input: { flex: 1, fontFamily: fonts.text, fontSize: 15, paddingVertical: spacing.md },
  error: { fontFamily: fonts.text, fontSize: 12 },
});

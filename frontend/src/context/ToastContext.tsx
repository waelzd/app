import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fonts, spacing, radius, useTheme } from "@/src/theme";

type ToastType = "success" | "error" | "info";
type ToastCtx = { show: (message: string, type?: ToastType) => void };

const ToastContext = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState("");
  const [type, setType] = useState<ToastType>("info");
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (message: string, t: ToastType = "info") => {
      setMsg(message);
      setType(t);
      if (timer.current) clearTimeout(timer.current);
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start();
      }, 2800);
    },
    [opacity],
  );

  const bg =
    type === "success" ? colors.success : type === "error" ? colors.error : colors.surfaceInverse;
  const fg =
    type === "success" ? colors.onSuccess : type === "error" ? colors.onError : colors.onSurfaceInverse;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.wrap,
          { top: insets.top + spacing.sm, opacity },
        ]}
      >
        {!!msg && (
          <View testID="toast" style={[styles.toast, { backgroundColor: bg }]}>
            <Text style={[styles.text, { color: fg, fontFamily: fonts.text }]}>{msg}</Text>
          </View>
        )}
      </Animated.View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 1000,
    alignItems: "center",
  },
  toast: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    maxWidth: 440,
  },
  text: { fontSize: 14, fontWeight: "600", textAlign: "center" },
});

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

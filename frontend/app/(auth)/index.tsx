import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Translate, SoccerBall } from "phosphor-react-native";

import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { useAuth } from "@/src/context/AuthContext";
import { useLang } from "@/src/context/LanguageContext";
import { useToast } from "@/src/context/ToastContext";
import { Button } from "@/src/components/ui/Button";
import { TextField } from "@/src/components/ui/TextField";
import { Segmented } from "@/src/components/ui/Segmented";
import { isValidEmail, isValidLebanesePhone, normalizePhone } from "@/src/lib/format";

const HERO = "https://images.unsplash.com/photo-1546608235-3310a2494cdf?w=1000&q=80";

export default function AuthScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login, register } = useAuth();
  const { t, isRTL, toggle } = useLang();
  const toast = useToast();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const goHome = (r: "user" | "admin") =>
    r === "admin" ? router.replace("/(admin)/(tabs)") : router.replace("/(user)/(tabs)");

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!isValidEmail(email)) e.email = "Invalid email";
    if (password.length < 6) e.password = "Min 6 characters";
    if (mode === "signup") {
      if (name.trim().length < 2) e.name = "Enter your name";
      if (!isValidLebanesePhone(phone)) e.phone = "Enter a valid +961 number";
      if (role === "admin" && adminCode.trim().length < 3) e.adminCode = "Admin code required";
    }
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      let user;
      if (mode === "login") {
        user = await login(email.trim(), password);
      } else {
        user = await register({
          name: name.trim(),
          email: email.trim(),
          phone: normalizePhone(phone),
          password,
          role,
          admin_secret: role === "admin" ? adminCode.trim() : undefined,
        });
      }
      toast.show(`${t("welcomeBack")}, ${user.name}`, "success");
      goHome(user.role);
    } catch (err: any) {
      toast.show(err?.message || "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <Image source={{ uri: HERO }} style={styles.hero} contentFit="cover" />
      <LinearGradient
        colors={["rgba(11,18,15,0.3)", "rgba(11,18,15,0.75)", colors.surface]}
        style={styles.heroScrim}
      />

      <Pressable
        testID="lang-toggle"
        onPress={toggle}
        style={[styles.langBtn, { top: insets.top + spacing.sm, backgroundColor: colors.surfaceSecondary }]}
        hitSlop={10}
      >
        <Translate size={20} color={colors.brandPrimary} weight="bold" />
        <Text style={[styles.langText, { color: colors.brandPrimary }]}>{t("language")}</Text>
      </Pressable>

      <KeyboardAwareScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 90, paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
        bottomOffset={20}
      >
        <View style={styles.brandWrap}>
          <View style={[styles.logo, { backgroundColor: colors.brandPrimary }]}>
            <SoccerBall size={30} color={colors.onBrandPrimary} weight="fill" />
          </View>
          <Text style={[styles.appName, { color: colors.onSurface }]}>{t("appName")}</Text>
          <Text style={[styles.tagline, { color: colors.brandPrimary }]}>{t("tagline")}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <Segmented
            testIDPrefix="auth-mode"
            options={[
              { key: "login", label: t("login") },
              { key: "signup", label: t("signup") },
            ]}
            value={mode}
            onChange={(m) => {
              setMode(m);
              setErrors({});
            }}
          />

          <View style={{ height: spacing.lg }} />

          {mode === "signup" && (
            <>
              <Text style={[styles.roleLabel, { color: colors.onSurfaceTertiary, textAlign: isRTL ? "right" : "left" }]}>
                {t("role")}
              </Text>
              <Segmented
                testIDPrefix="auth-role"
                options={[
                  { key: "user", label: t("user") },
                  { key: "admin", label: t("admin") },
                ]}
                value={role}
                onChange={setRole}
              />
              <View style={{ height: spacing.md }} />
              <TextField
                testID="input-name"
                label={t("fullName")}
                value={name}
                onChangeText={setName}
                placeholder="Ali Hassan"
                error={errors.name}
              />
            </>
          )}

          <TextField
            testID="input-email"
            label={t("email")}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          {mode === "signup" && (
            <TextField
              testID="input-phone"
              label={t("phone")}
              value={phone}
              onChangeText={setPhone}
              placeholder="70 123 456"
              keyboardType="phone-pad"
              prefix="+961"
              error={errors.phone}
            />
          )}

          <TextField
            testID="input-password"
            label={t("password")}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            error={errors.password}
          />

          {mode === "signup" && role === "admin" && (
            <TextField
              testID="input-admin-code"
              label={t("adminCode")}
              value={adminCode}
              onChangeText={setAdminCode}
              placeholder="malaeb-admin-••••"
              autoCapitalize="none"
              error={errors.adminCode}
            />
          )}

          <View style={{ height: spacing.sm }} />
          <Button
            testID="auth-submit"
            title={mode === "login" ? t("login") : t("createAccount")}
            onPress={submit}
            loading={loading}
          />

          <Pressable
            testID="auth-switch"
            onPress={() => {
              setMode(mode === "login" ? "signup" : "login");
              setErrors({});
            }}
            style={styles.switch}
          >
            <Text style={[styles.switchText, { color: colors.muted }]}>
              {mode === "login" ? t("noAccount") : t("haveAccount")}{" "}
              <Text style={{ color: colors.brandPrimary, fontWeight: "800" }}>
                {mode === "login" ? t("signup") : t("login")}
              </Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { position: "absolute", top: 0, left: 0, right: 0, height: 340 },
  heroScrim: { position: "absolute", top: 0, left: 0, right: 0, height: 380 },
  langBtn: {
    position: "absolute",
    right: spacing.lg,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  langText: { fontFamily: fonts.text, fontSize: 13, fontWeight: "700" },
  scroll: { paddingHorizontal: spacing.lg },
  brandWrap: { alignItems: "center", marginBottom: spacing.xl },
  logo: { width: 60, height: 60, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  appName: { fontFamily: fonts.display, fontSize: 44, letterSpacing: 2 },
  tagline: { fontFamily: fonts.text, fontSize: 14, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg },
  roleLabel: { fontFamily: fonts.text, fontSize: 13, fontWeight: "600", marginBottom: spacing.xs },
  switch: { alignItems: "center", paddingVertical: spacing.md },
  switchText: { fontFamily: fonts.text, fontSize: 14 },
});

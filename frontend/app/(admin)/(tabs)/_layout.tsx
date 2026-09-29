import React from "react";
import { Platform } from "react-native";
import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { ChartBar, SoccerBall, Bell, Trophy } from "phosphor-react-native";

import { useTheme } from "@/src/theme";
import { useLang } from "@/src/context/LanguageContext";
import { usesNativeTabs } from "@/src/navigation";

export default function AdminTabsLayout() {
  const { colors } = useTheme();
  const { t } = useLang();

  if (usesNativeTabs) {
    return (
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon sf="chart.bar.fill" />
          <NativeTabs.Trigger.Label>{t("dashboard")}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="fields">
          <NativeTabs.Trigger.Icon sf="sportscourt.fill" />
          <NativeTabs.Trigger.Label>{t("fields")}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="requests">
          <NativeTabs.Trigger.Icon sf="bell.fill" />
          <NativeTabs.Trigger.Label>{t("requests")}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="tournaments">
          <NativeTabs.Trigger.Icon sf="trophy.fill" />
          <NativeTabs.Trigger.Label>{t("tournaments")}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surfaceSecondary,
          borderTopColor: colors.divider,
          ...(Platform.OS === "web" ? { height: 64 } : {}),
        },
        tabBarItemStyle: { alignSelf: "center" },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700", fontFamily: "Manrope" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t("dashboard"), tabBarIcon: ({ color }) => <ChartBar size={24} color={color} weight="fill" /> }} />
      <Tabs.Screen name="fields" options={{ title: t("fields"), tabBarIcon: ({ color }) => <SoccerBall size={24} color={color} weight="fill" /> }} />
      <Tabs.Screen name="requests" options={{ title: t("requests"), tabBarIcon: ({ color }) => <Bell size={24} color={color} weight="fill" /> }} />
      <Tabs.Screen name="tournaments" options={{ title: t("tournaments"), tabBarIcon: ({ color }) => <Trophy size={24} color={color} weight="fill" /> }} />
    </Tabs>
  );
}

import React from "react";
import { Platform } from "react-native";
import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { House, SoccerBall, Trophy, Ticket } from "phosphor-react-native";

import { useTheme } from "@/src/theme";
import { useLang } from "@/src/context/LanguageContext";
import { usesNativeTabs } from "@/src/navigation";

export default function UserTabsLayout() {
  const { colors } = useTheme();
  const { t } = useLang();

  if (usesNativeTabs) {
    return (
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon sf="house.fill" />
          <NativeTabs.Trigger.Label>{t("home")}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="fields">
          <NativeTabs.Trigger.Icon sf="sportscourt.fill" />
          <NativeTabs.Trigger.Label>{t("fields")}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="tournaments">
          <NativeTabs.Trigger.Icon sf="trophy.fill" />
          <NativeTabs.Trigger.Label>{t("tournaments")}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="bookings">
          <NativeTabs.Trigger.Icon sf="ticket.fill" />
          <NativeTabs.Trigger.Label>{t("bookings")}</NativeTabs.Trigger.Label>
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
      <Tabs.Screen
        name="index"
        options={{ title: t("home"), tabBarIcon: ({ color }) => <House size={24} color={color} weight="fill" /> }}
      />
      <Tabs.Screen
        name="fields"
        options={{ title: t("fields"), tabBarIcon: ({ color }) => <SoccerBall size={24} color={color} weight="fill" /> }}
      />
      <Tabs.Screen
        name="tournaments"
        options={{ title: t("tournaments"), tabBarIcon: ({ color }) => <Trophy size={24} color={color} weight="fill" /> }}
      />
      <Tabs.Screen
        name="bookings"
        options={{ title: t("bookings"), tabBarIcon: ({ color }) => <Ticket size={24} color={color} weight="fill" /> }}
      />
    </Tabs>
  );
}

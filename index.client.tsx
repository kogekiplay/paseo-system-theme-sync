import type { PluginClientContext } from "@getpaseo/plugin/client";
import { Platform } from "react-native";
import { createStatusScreen } from "./client/status";
import { install } from "./client/web";

export default function contribute(client: PluginClientContext) {
  const controller = install(Platform.OS === "web");
  const removeSettings = client.addSettingsScreen({
    id: "status", title: "系统主题同步", icon: "SunMoon",
    Component: createStatusScreen(controller),
  });
  const removeCommand = client.addCommandCenterItem({
    id: "sync", title: "系统主题同步：检查并修复", icon: "SunMoon", context: "global",
    onSelect({ openSettings }) {
      controller.sync();
      openSettings("status");
    },
  });
  return () => {
    removeCommand();
    removeSettings();
    controller.dispose();
  };
}

import type { PluginSurfaceProps } from "@getpaseo/plugin/client";
import { useSyncExternalStore } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { SyncController } from "./web";

export function createStatusScreen(controller: SyncController) {
  return function Status({ theme, layout }: PluginSurfaceProps) {
    const status = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
    const colors = theme.colors;
    const text = { color: colors.foreground, fontSize: 14, lineHeight: 22 };
    const muted = { ...text, color: colors.foregroundMuted };
    const mode = status.preference === "auto" ? "跟随系统" : status.preference ?? "未读取到设置";
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.surface0 }}>
        <View style={{ padding: layout.compact ? 16 : 28, gap: 16, maxWidth: 720, width: "100%" }}>
          <Text style={{ ...text, fontSize: 22, fontWeight: "600", lineHeight: 30 }}>系统主题同步</Text>
          <Text style={text}>
            {!status.supported ? "当前客户端无需此网页样式修复。" : status.preference === "auto"
              ? "正在自动同步。macOS 切换深浅外观后，页面背景与文字会一起跟随系统。"
              : "当前使用固定主题，自动修复待命。请在「外观」中选择「系统」启用同步。"}
          </Text>
          <View style={{ gap: 8, padding: 16, borderRadius: 10, backgroundColor: colors.surface1 }}>
            <Text style={text}>Paseo 主题：{mode}</Text>
            <Text style={text}>系统外观：{status.system === "dark" ? "深色" : status.system === "light" ? "浅色" : "未知"}</Text>
            <Text style={text}>清理次数：{status.repairs}</Text>
            <Text style={muted}>当前根节点类：{status.rootClasses || "无固定主题类"}</Text>
            <Text style={muted}>最近清理：{status.lastRemoved || "尚未发现残留"}</Text>
            {status.error ? <Text style={text}>诊断信息：{status.error}</Text> : null}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="立即检查主题同步" onPress={controller.sync}
            style={{ alignSelf: "flex-start", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: colors.accent }}>
            <Text style={{ color: colors.accentForeground, fontSize: 14 }}>立即检查</Text>
          </Pressable>
          <Text style={muted}>
            修复 Paseo 从固定主题切回系统后，残留样式覆盖系统配色的问题。
            仅在跟随系统时清理残留类；本插件在当前客户端本地运行。
          </Text>
        </View>
      </ScrollView>
    );
  };
}

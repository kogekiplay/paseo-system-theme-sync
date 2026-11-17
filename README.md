# System Theme Sync

修复 macOS 已切换深浅外观，但 Paseo 的背景与文字只有部分跟随、需要刷新页面的问题。

Paseo 0.15.4 和 0.16.0 从固定主题切回「系统」时，Unistyles 可能在页面根节点留下 `light` 或 `dark` 等固定主题类。它们会覆盖系统配色，而部分文字与内容仍随系统更新。本插件只在保存的主题为「系统」时清除已知残留类，让背景和文字重新使用一致的系统配色，无需刷新。

## 安装与使用

```sh
paseo plugin install git:kogekiplay/paseo-system-theme-sync
```

也可以在 Paseo 的插件来源中填写上述 GitHub 来源。插件须在目标主机启用。安装后将「设置 → 外观 → 主题」设为「系统」。按 ⌘K 搜索「系统主题同步」可查看系统外观、残留类和修复次数。

更新已安装的 GitHub 版本：

```sh
paseo plugin update paseo-system-theme-sync
```

当前适配 Paseo `>=0.15.4 <0.17.0`，已核对 0.15.4 和 0.16.0。插件在桌面端和网页端运行；iOS、Android 原生客户端不执行 DOM 修复。固定主题和插件主题仍由 Paseo 控制。本插件不修改 macOS 设置，也不会刷新页面。

## 开发与验证

```sh
npm ci --ignore-scripts
npm run typecheck
npm test
```

测试直接执行安装包中提取的 Unistyles runtime，独立于其他已安装插件复现原问题，并验证双向系统切换、固定主题保留、设置写入时序和插件清理。0.16.0 的运行时与 0.15.4 的夹具逐字节一致，共用同一份回归测试；客户端入口使用 0.16.0 SDK 进行类型检查。测试夹具的来源与许可见 [PROVENANCE](tests/fixtures/PROVENANCE.md) 和 [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES.md)。

人工验收必须保持 Paseo 为「系统」，实际切换 **macOS 的外观**，检查浅色到深色、深色到浅色以及切回应用后的表现。仅在 Paseo 内点击 Light/Dark 不能验证系统跟随问题。

插件只有客户端入口。它读取本机 Paseo 设置中的主题字段，监听系统配色与根节点类变化；为接收同一窗口内的设置写入，会透明包装浏览器的 `Storage.prototype.setItem`。停用后释放监听器和自身包装。它不读取聊天内容，不向外部服务发送数据，也不处理其他插件任意注入的样式或所有原生主题通知问题。

## English

System Theme Sync fixes a stale root theme class in Paseo 0.15.4 and 0.16.0 that can leave backgrounds and text on different palettes after macOS changes appearance. Install from GitHub and select **System** under Settings → Appearance. The plugin repairs the current page without a reload, preserves fixed and contributed themes, and runs only in desktop/web clients. No server entry or external service is required.

# 合并全屏壁纸模式实施计划

对应规范：`docs/superpowers/specs/2026-07-13-consolidate-fullscreen-wallpaper-mode-design.md`

## 任务 1：收敛菜单选项

**文件**

- 新建：`scripts/appearance-wallpaper-mode.test.mjs`
- 修改：`src/components/AppearanceSettings.astro`

**步骤**

1. 添加测试，断言壁纸菜单依次只有 `banner`、`transparent`、`solid` 三个按钮，用户可见文案依次为“横幅壁纸”“全屏壁纸”“纯色背景”。
2. 运行新增测试，确认它因旧 `fullscreen` 按钮与旧文案仍存在而失败。
3. 删除旧按钮，并把 `transparent` 按钮重命名为“全屏壁纸”。
4. 重新运行测试并确认转绿。

## 任务 2：迁移旧设置

**文件**

- 修改：`scripts/appearance-wallpaper-mode.test.mjs`
- 修改：`src/layouts/BaseLayout.astro`

**步骤**

1. 在隔离的浏览器脚本上下文中执行真实外观设置逻辑，断言旧 `fullscreen` 会规范化和应用为 `transparent`，且规范模式列表不再接受 `fullscreen`。
2. 运行测试，确认它因旧值仍原样保留而失败。
3. 在模式白名单校验前加入 `fullscreen` 到 `transparent` 的兼容迁移，并把白名单收敛为三个模式。
4. 重新运行测试并确认转绿。

## 任务 3：删除旧 CSS 功能

**文件**

- 修改：`scripts/appearance-wallpaper-mode.test.mjs`
- 修改：`src/styles/global.css`

**步骤**

1. 添加测试，断言 CSS 中不存在 `data-wallpaper-mode="fullscreen"` 选择器，同时保留 `transparent` 的全屏背景和透明表面规则。
2. 运行测试，确认它因旧选择器仍存在而失败。
3. 删除 `fullscreen` 专属背景规则，并从暗色、系统暗色、首页横幅及标题共享选择器中移除旧模式。
4. 重新运行测试并确认转绿。

## 任务 4：接入与完整验证

**文件**

- 修改：`package.json`

**步骤**

1. 添加 `test:appearance` 脚本并通过该脚本运行专项测试。
2. 运行现有相关测试与完整生产构建。
3. 使用全仓搜索确认 `fullscreen` 只剩兼容迁移和对应测试说明，不再存在菜单值或 CSS 功能分支。
4. 运行 `git diff --check` 并复核最终差异，确保不包含日志、构建产物或其他未跟踪文件。

# 随笔与分享页面副标题实施计划

对应规范：`docs/superpowers/specs/2026-07-11-section-subtitles-design.md`

## 任务 1：添加失败的回归测试

**文件**

- 修改：`scripts/section-index.test.mjs`

**步骤**

1. 断言随笔页输出 `<h1>随笔</h1>` 与共享类副标题“浮生拾遗”。
2. 断言分享页输出 `<h1>分享</h1>` 与共享类副标题“任君采撷”。
3. 断言旧 kicker、替代主标题和说明段落不再出现。
4. 断言现有统计文案仍存在。
5. 断言共享副标题样式包含中文书卷气字体栈、次要文字颜色、`400` 字重、字间距、`-6deg` 倾斜和移动端收紧规则。
6. 运行测试并确认因旧标题结构仍存在而失败。

## 任务 2：最小实现

**文件**

- 修改：`src/pages/tools.astro`
- 修改：`src/pages/share.astro`
- 修改：`src/styles/global.css`

**步骤**

1. 删除两个页面标题组中的 kicker 和说明段落。
2. 将主标题分别改为“随笔”和“分享”。
3. 在主标题正下方加入共用 `.section-subtitle` 段落。
4. 添加一条共享副标题样式并在移动端轻微缩小字号与字间距。
5. 保留统计结构和计算逻辑，不修改其他栏目内容。
6. 运行栏目页测试并确认转绿。

## 任务 3：完整验证

```powershell
npm run test:sections
npm run test:obsidian
npm run test:toc
npm run test:external-links
npm run build
```

最后运行 `git diff --check`，确认改动只落在两个页面、共享样式和对应测试。

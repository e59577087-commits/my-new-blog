# 随笔与分享页面差异化实施计划

对应设计规范：`docs/superpowers/specs/2026-07-11-essay-share-differentiation-design.md`

## 实施原则

- 使用测试驱动方式：先添加会失败的页面构建断言，再完成最小实现，最后整理样式与组件边界。
- 保留现有 `EntryCard` 给首页和其他通用列表使用；栏目页使用各自的专用组件。
- 不增加依赖，不改变文章 frontmatter schema，不改文章详情页和首页。
- 每个任务完成后运行对应测试；全部完成后运行全套测试与生产构建。

## 任务 1：建立栏目页回归测试

**文件**

- 新建：`scripts/section-index.test.mjs`
- 修改：`package.json`

**步骤**

1. 编写构建级测试，在测试前向 `src/content/articles/` 写入临时随笔、分享和草稿文章。
2. 临时数据覆盖：跨月份随笔、重复/带首尾空白的分享标签、多标签文章、草稿分享文章、缺少可选字段的文章。
3. 调用 Astro CLI 进行一次生产构建，读取 `/tools/index.html` 与 `/share/index.html`。
4. 先断言新结构尚不存在，确认测试失败：
   - 随笔页具有专属时间线标记、年月分组和空值回退。
   - 分享页具有专属资料库标记、“全部”筛选项、清理并去重后的标签。
   - 草稿标签不出现在筛选栏。
   - 分享卡片包含可供客户端筛选的标签数据。
   - 两页不再使用 `data-appearance-article-list="catalog"`。
5. 在测试清理阶段删除所有临时文章。
6. 在 `package.json` 增加 `test:sections` 命令。

**验证**

```powershell
npm run test:sections
```

预期：实现前因缺少新结构而失败。

## 任务 2：实现随笔时间线

**文件**

- 新建：`src/components/EssayTimeline.astro`
- 修改：`src/pages/tools.astro`
- 修改：`src/styles/global.css`
- 修改：`scripts/section-index.test.mjs`

**步骤**

1. 在 `tools.astro` 中继续调用 `getPublishedBySection("essay")`，计算文章数量和最近更新月份。
2. 将已按日期倒序的文章按年份、月份分组，并把分组结果传给 `EssayTimeline`。
3. `EssayTimeline` 输出语义化列表：年月标题、日期、文章标题、description、标签、小封面和整卡链接。
4. 对第一篇文章添加稳定的 latest 标记，仅通过轻微的边框、尺寸或强调色突出。
5. 没有文章时输出随笔专属空状态；缺少 description 或 tags 时不渲染空容器；封面使用 `coverOrDefault`。
6. 在 `global.css` 中增加基于现有变量的暖色时间线样式、键盘焦点、明暗主题和移动端单列规则。封面列桌面端设为 `10.5rem`、手机端设为 `7rem`，但卡片现有 `min-height` 分别保持 `8.25rem` 和 `7rem`，只加宽封面、不增加卡片高度。
7. 补充测试断言：日期倒序、年月分组、最新条目、空可选字段与专属空状态源结构。

**验证**

```powershell
npm run test:sections
```

预期：随笔相关断言通过，分享相关断言仍失败。

## 任务 3：实现分享资料库与自动筛选项

**文件**

- 新建：`src/components/ShareLibrary.astro`
- 修改：`src/pages/share.astro`
- 修改：`src/styles/global.css`
- 修改：`scripts/section-index.test.mjs`

**步骤**

1. 在 `share.astro` 获取已发布分享文章，并从文章 `tags` 中生成筛选项：`trim()`、丢弃空字符串、按首次出现顺序去重。
2. 将文章和筛选项传给 `ShareLibrary`，固定在首位输出“全部”。
3. 每张知识卡输出 category 回退文案、标题、description、标签、更新时间、封面回退以及规范化的 `data-tags`。
4. 筛选按钮使用原生 `button`，初始“全部”为 `aria-pressed="true"`。
5. 添加局部客户端脚本：点击按钮时更新 `aria-pressed`、显示匹配卡片、隐藏不匹配卡片，并同步无结果提示。
6. 无文章时输出资料库专属空状态；筛选无结果时提供重置为“全部”的按钮。
7. 在 `global.css` 中增加冷色资料库样式、稳定网格、横向可滚动筛选栏、焦点状态、暗色主题和手机单列规则。
8. 补充测试断言：标签清理/去重、草稿排除、多标签数据、按钮可访问状态、无结果与重置控件源结构。

**验证**

```powershell
npm run test:sections
```

预期：所有栏目页测试通过。

## 任务 4：统一细节并控制改动范围

**文件**

- 修改：`src/components/EssayTimeline.astro`
- 修改：`src/components/ShareLibrary.astro`
- 修改：`src/pages/tools.astro`
- 修改：`src/pages/share.astro`
- 修改：`src/styles/global.css`

**步骤**

1. 检查两页共用现有字体、圆角、表面色、动效和 focus-visible 语言，不重复定义全站基础样式。
2. 确认栏目专属组件不读取或依赖全站 `data-article-layout`，list/grid 偏好不会改变它们的结构。
3. 确认装饰性时间线使用 `aria-hidden="true"` 或纯 CSS，不污染阅读顺序。
4. 确认筛选隐藏状态同时使用 `hidden`，避免隐藏卡片仍被键盘聚焦。
5. 尊重现有 reduced-motion 规则，不添加承担信息传递的动画。
6. 检查长标题、多标签、无 description、无 cover 和只有一篇文章时的布局稳定性。

## 任务 5：完整验证与交付

**自动验证**

```powershell
npm run test:obsidian
npm run test:toc
npm run test:sections
npm run build
```

**目视验证**

1. 桌面端检查 `/tools/`：时间线、年月层级、最新文章强调、暖色气质。
2. 桌面端检查 `/share/`：筛选按钮、标签匹配、重置、资料库网格、冷色气质。
3. 手机端检查两页：单列布局、标签横向滚动、无横向溢出、长标题与标签换行。
4. 检查浅色与深色主题。
5. 仅使用键盘遍历筛选按钮和文章链接，确认焦点顺序与状态清楚。
6. 确认首页、文章详情页以及全站 list/grid 外观偏好未发生回归。

**交付检查**

- 查看 `git diff --check`。
- 确认没有提交构建产物、开发日志或 `.superpowers/` 草图目录。
- 汇总修改文件、测试结果和任何仍需人工判断的视觉细节。

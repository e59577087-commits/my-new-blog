# 首页栏目副标题统一实施计划

对应规范：`docs/superpowers/specs/2026-07-11-home-section-subtitles-design.md`

## 任务 1：添加失败的首页构建断言

**文件**

- 修改：`scripts/section-index.test.mjs`

**步骤**

1. 在现有栏目测试夹具中增加一篇临时学习文章，使首页三个栏目都能渲染。
2. 构建后读取 `dist/index.html`。
3. 断言首页分别输出“浮生拾遗”“任君采撷”和完整学习副标题。
4. 断言三句旧副标题不再出现。
5. 断言三处均使用 `section-subtitle home-section-subtitle`。
6. 断言学习副标题删除线只包裹“并非挠自己头”。
7. 断言 CSS 包含紧凑字号、间距、字距和换行规则。
8. 运行目标测试并确认因首页仍使用旧文案而失败。

## 任务 2：最小实现

**文件**

- 修改：`src/pages/index.astro`
- 修改：`src/styles/global.css`

**步骤**

1. 将三句旧副标题替换为对应栏目页副标题。
2. 三处统一使用 `section-subtitle home-section-subtitle`。
3. 学习副标题复用 `study-subtitle-strike`，删除线只包裹括号内文字。
4. 新增 `.home-section-subtitle`，仅覆盖首页的紧凑字号、间距、字距与换行。
5. 不改变栏目条件渲染、标题、查看全部链接、卡片和分隔线。
6. 运行目标测试并确认转绿。

## 任务 3：完整验证

```powershell
npm run test:sections
npm run test:study
npm run test:obsidian
npm run test:toc
npm run test:external-links
npm run build
```

最后运行 `git diff --check`，确认没有改动首页其他布局或提交测试临时文章。

# 关于页全屏雨夜统计实施计划

对应规范：`docs/superpowers/specs/2026-07-11-about-rain-window-design.md`

## 任务 1：扩展失败回归测试

**文件**

- 修改：`scripts/about-rain-window.test.mjs`
- 新建：`scripts/article-word-count.test.mjs`
- 修改：`package.json`

**步骤**

1. 将关于页结构断言改为全屏视频背景和单一统计浮层。
2. 断言旧页面标识、标题、自述、在线信号、左右网格和窗框装饰不再出现。
3. 断言统计卡包含文章数、访问数、运行天数和正文总字数四项。
4. 断言桌面四列、手机两列，并存在无边框雾面浮层样式。
5. 为字数函数增加中文、英文、数字、Markdown 标记、链接、HTML、代码块和空正文测试。
6. 在 `package.json` 增加 `test:word-count`。
7. 运行两个专项测试，确认因新结构和字数函数尚不存在而失败。

## 任务 2：实现文章正文计数工具

**文件**

- 新建：`src/utils/articleWordCount.ts`

**步骤**

1. 清除 fenced code 标记但保留其中可读代码词，移除 Markdown 与 HTML 装饰语法。
2. 移除链接目标地址，只保留链接显示文本。
3. 统计 CJK 表意字符数量。
4. 统计剩余拉丁字母和数字组成的连续词元数量。
5. 导出单篇计数和文章集合总计函数，保证空值返回 0。
6. 运行 `npm run test:word-count` 直到通过。

## 任务 3：扩展统计卡数据与浮层变体

**文件**

- 修改：`src/components/StatsCard.astro`

**步骤**

1. 新增 `totalWordCount` 属性和第四个“正文总字数”统计项。
2. 保留现有访问次数与运行天数逻辑。
3. 增加 `overlay` 变体：无明确边框、低对比半透明背景、适度背景模糊和轻阴影。
4. overlay 桌面四列，手机两列两行；取消 compact 变体不再需要的嵌套卡片视觉。
5. 数字使用中文本地化分隔，保持静态显示。

## 任务 4：将雨夜组件改为全屏背景

**文件**

- 修改：`src/components/AboutRainWindow.astro`

**步骤**

1. 组件根节点绝对定位覆盖父级，视频铺满并保持 poster 降级。
2. 删除面向左右栏的尺寸、外扩和边缘融合假设。
3. 增加主题自适应的全屏遮罩，浅色模式较亮、深色模式蓝黑。
4. 保留视频模糊转清晰、轻量雨痕、视差、错误降级和 reduced-motion。
5. 窗景就绪事件继续作为统计卡入场信号。

## 任务 5：重构关于页为全屏统计首屏

**文件**

- 修改：`src/pages/about.astro`

**步骤**

1. 获取一次已发布文章集合，同时计算文章数和正文总字数。
2. 删除页面标识、标题、自述、在线信号、左右网格和旧文字入场序列。
3. 输出全屏 `AboutRainWindow` 与右下 `StatsCard variant="overlay"`。
4. 视频就绪后只触发统计卡整体淡入；reduced-motion 下直接显示最终状态。
5. 桌面保持四项横排，手机将统计卡放到底部并改为两列。
6. 确保页头、页脚、滚动顶按钮和主题切换仍正常工作。

## 任务 6：验证

```powershell
npm run test:word-count
npm run test:about
npm run test:sections
npm run test:obsidian
npm run test:toc
npm run test:external-links
npm run test:study
npm run build
```

目视验证桌面、手机、明暗主题、reduced-motion、视频失败、小猫裁切、统计卡可读性和页面无横向滚动。最后运行 `git diff --check`，确认没有临时文件、构建产物或无关改动。

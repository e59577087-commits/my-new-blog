# 修复全屏壁纸黑洞黑圈实施计划

对应规范：`docs/superpowers/specs/2026-07-13-fix-fullscreen-black-hole-halo-design.md`

## 任务 1：建立失败的背景合成测试

**文件**

- 新建：`scripts/homepage-black-hole-backdrop.test.mjs`

**步骤**

1. 从 `HomepageBlackHole.astro` 提取 `captureWholePageTexture` 源码段。
2. 断言捕获前读取 `document.body` 的计算样式，并快照保存完整背景属性。
3. 断言背景属性只写入 `onclone` 获得的克隆 scope，不写入真实 scope。
4. 运行测试，确认它因当前捕获没有合成 body 背景而失败。

## 任务 2：最小修复离屏捕获纹理

**文件**

- 修改：`src/components/HomepageBlackHole.astro`

**步骤**

1. 在调用 `html2canvas` 前读取 body 的背景颜色、图像、位置、尺寸、重复、固定、原点和裁剪属性。
2. 在 `onclone` 中把属性以高优先级应用到克隆的 `.home-black-hole-scope`。
3. 保持横幅裁剪、黑洞节点排除、DOM 扭曲还原和 WebGL 上传逻辑不变。
4. 重新运行新增测试并确认转绿。

## 任务 3：接入与完整验证

**文件**

- 修改：`package.json`

**步骤**

1. 添加 `test:black-hole-backdrop` 测试入口。
2. 运行专项测试、仓库全部 Node 测试和 Astro 生产构建。
3. 复核差异，确认片元着色器、黑洞配置和真实 DOM 样式没有改动。
4. 在全量测试之后再次生产构建，防止测试夹具污染 `dist`。
5. 更新本地预览，供用户比较横幅壁纸与全屏壁纸模式。

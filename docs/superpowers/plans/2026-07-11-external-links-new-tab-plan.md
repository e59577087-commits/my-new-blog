# 文章外部链接新标签页实施计划

对应规范：`docs/superpowers/specs/2026-07-11-external-links-new-tab-design.md`

## 任务 1：建立失败的构建级测试

**文件**

- 新建：`scripts/external-links.test.mjs`
- 修改：`package.json`

**步骤**

1. 测试前在文章目录创建一篇临时文章，包含 HTTP、HTTPS、站内路径、相对路径、锚点、邮箱、电话和 Obsidian 双链。
2. 运行 Astro 生产构建并读取临时文章的最终 HTML。
3. 断言 HTTP(S) 链接具有 `target="_blank"` 与 `rel="noopener noreferrer"`。
4. 断言其他链接以及 Obsidian 双链没有新标签页属性。
5. 断言链接文本、URL 和 title 没有被改写。
6. 测试结束后删除临时文章；在 `package.json` 添加 `test:external-links`。
7. 运行测试并确认因功能尚不存在而失败。

## 任务 2：实现 remark 插件

**文件**

- 新建：`src/utils/remark-external-links.ts`
- 修改：`astro.config.mjs`

**步骤**

1. 遍历 `link` 节点，识别大小写不敏感的 HTTP(S) 前缀。
2. 保留已有 `data` 和 `hProperties`，为匹配链接写入 `target` 与 `rel`。
3. 将插件注册到现有 Markdown processor。
4. 运行新增测试并确认转绿。

## 任务 3：完整验证

```powershell
npm run test:external-links
npm run test:obsidian
npm run test:toc
npm run test:sections
npm run build
```

最后运行 `git diff --check`，确认未引入客户端链接修补脚本、构建产物或临时文章。

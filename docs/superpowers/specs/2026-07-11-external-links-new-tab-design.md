# 文章外部链接新标签页设计

## 目标

文章正文中的外部网址应自动在新标签页打开，作者不需要为每个链接手写 HTML。站内导航和文章之间的阅读流保持当前标签页，避免所有点击都产生新标签页。

## 适用范围

仅处理 Markdown 文章正文中解析出的标准链接节点：

- `https://...`
- `http://...`

为这些链接生成：

```html
target="_blank"
rel="noopener noreferrer"
```

`noopener` 防止新页面访问原页面的 `window.opener`；`noreferrer` 不发送来源信息，并为旧环境提供额外隔离。

以下链接保持原样并在当前标签页处理：

- `/articles/...` 等站内绝对路径。
- `../...`、`./...` 等相对路径。
- `#...` 页面锚点。
- `mailto:`、`tel:` 及其他非 HTTP(S) 协议。
- Obsidian 双链生成的站内文章链接。

原始 Markdown HTML 中手写的 `<a>` 不属于标准链接节点，不自动覆盖其属性，继续尊重作者手写行为。

## 实现方式

- 新建一个职责单一的 remark 插件，遍历 Markdown AST 的 `link` 节点。
- 仅当链接 URL 满足大小写不敏感的 `http://` 或 `https://` 前缀时，在节点的 `data.hProperties` 中添加 `target` 与 `rel`。
- 插件在现有 Markdown processor 中与 `remarkObsidian` 一起注册。
- 不使用客户端 JavaScript，不增加第三方依赖，不改变现有文章内容文件。
- 插件必须保留节点已经存在的其他 `hProperties`；对于目标安全属性，统一使用本规范规定的值。

## 行为边界

- 绝对 HTTP(S) 地址一律视为外部地址，即使域名恰好是本站域名。站内文章应继续使用相对路径或 Obsidian 双链。
- 链接文本、title 和 URL 不被改写。
- 图片链接和普通图片节点不在本次范围内。
- 无效或空 URL 由现有 Markdown 解析和构建流程处理，本插件不抛出额外错误。

## 测试与验收

添加构建级自动测试，临时生成包含以下链接的文章并检查最终 HTML：

- HTTPS 外部链接具有 `target="_blank"` 和 `rel="noopener noreferrer"`。
- HTTP 外部链接具有相同属性。
- 站内路径、相对路径、锚点、邮箱和电话链接没有 `target="_blank"`。
- Obsidian 双链生成的站内链接没有新标签页属性。
- 外部链接的文本、URL 和 title 保持不变。

完成后运行新增测试、现有 Obsidian/目录测试及生产构建。生成 HTML 中不应出现客户端链接修补脚本。

## 不做事项

- 不改变导航、页脚、关于页等 Astro 模板中的链接。
- 不自动处理手写 HTML `<a>`。
- 不为外部链接增加图标、提示文字或跳转确认页。
- 不记录点击数据，也不引入分析服务。

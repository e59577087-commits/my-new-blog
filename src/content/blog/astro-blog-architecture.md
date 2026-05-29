---
title: "用 Astro 搭建内容优先的技术博客"
description: "从目录结构、Markdown 内容集合到静态部署，梳理一个现代中文技术博客的基础架构。"
date: 2026-05-18
tags: ["Astro", "Markdown", "架构"]
cover: "/covers/astro-blog-architecture.svg"
draft: false
featured: true
---

## 为什么选择 Astro

Astro 很适合个人技术博客，因为它默认把内容和性能放在前面。页面可以保持静态输出，组件只在需要交互时才加载到浏览器。

## 内容结构

这套结构会把页面、组件、内容和数据分开：页面负责路由，组件负责复用的界面，Markdown 负责文章正文，TypeScript 数据文件负责 mock 信息。

```ts
const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    tags: z.array(z.string()),
  }),
});
```

## 后续扩展

后续可以继续加入 RSS、站内搜索、文章目录和代码高亮，但第一步应该先保证结构清晰、页面稳定、部署路径简单。

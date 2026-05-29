---
title: "Cloudflare Pages 静态部署清单"
description: "记录 Astro 项目部署到 Cloudflare Pages 前需要确认的构建命令、输出目录和环境边界。"
date: 2026-05-12
tags: ["Cloudflare", "部署", "前端工程"]
cover: "/covers/cloudflare-pages-deploy.svg"
draft: false
featured: true
---

## 构建配置

静态 Astro 项目部署到 Cloudflare Pages 通常不需要额外适配器。构建命令使用 `npm run build`，输出目录使用 `dist`。

```sh
npm run build
```

## 早期边界

个人博客早期可以先保持纯静态，不接入数据库，也不引入服务端渲染。这样能减少部署变量，让写作、样式和内容结构先稳定下来。

## 后续服务

当后续需要评论、订阅或访问统计时，再根据真实需求选择边缘函数、第三方服务或轻量后端。

# 李明的技术手记

一个使用 Astro 搭建的中文个人技术博客。第一阶段目标是先完成静态站点骨架、内容集合、基础页面、暗色界面和 Cloudflare Pages 部署准备。

## 当前范围

- 首页、博客列表、文章详情、关于页、工具页
- Astro Content Collection 管理 Markdown 文章
- TailwindCSS 4 负责全站样式
- 基础 SEO、Open Graph、RSS、robots 和 sitemap
- Markdown 博客系统，支持标签、TOC、代码高亮、复制按钮、RSS 和 sitemap

## 目录结构

```text
src/
  components/       可复用界面组件
  content/blog/     Markdown 文章
  data/             站点配置与工具数据
  layouts/          页面基础布局
  pages/            Astro 路由页面
  styles/           全局样式
public/             favicon、社交预览图、静态响应头和图片资产
```

## 本地开发

```sh
npm install
npm run dev
npm run build
npm run preview
```

## 文章 Frontmatter

文章放在 `src/content/blog`，字段如下：

```yaml
---
title: "文章标题"
description: "文章摘要"
date: 2026-05-18
tags: ["Astro", "Markdown"]
cover: "/covers/example.svg"
draft: false
---
```

## 部署

Cloudflare Pages 推荐配置：

- 构建命令：`npm run build`
- 输出目录：`dist`
- Node 版本：`22.12.0` 或更高

正式上线前需要配置 `PUBLIC_SITE_URL`。完整部署说明见 `DEPLOYMENT.md`。

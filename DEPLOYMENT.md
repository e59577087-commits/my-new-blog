# Cloudflare Pages 部署说明

本文档用于把当前 Astro 博客部署到 Cloudflare Pages，并为后续绑定 `.com` 域名预留配置。

## 1. Astro 配置

`astro.config.mjs` 已完成 Cloudflare Pages 兼容配置：

- 输出模式保持默认静态输出，不需要额外 adapter
- `site` 使用 `PUBLIC_SITE_URL` 环境变量
- 构建输出目录为 Astro 默认的 `dist`
- Markdown 使用 Shiki 代码高亮

正式域名确定后，把 `PUBLIC_SITE_URL` 设置为最终访问地址，例如：

```env
PUBLIC_SITE_URL="https://example.com"
```

如果你决定使用 `www` 子域名，则统一使用：

```env
PUBLIC_SITE_URL="https://www.example.com"
```

不要同时混用 apex 域名和 `www` 域名作为 canonical 地址。

## 2. Cloudflare Pages 配置

Cloudflare Pages 项目配置：

```text
Framework preset: Astro
Build command: npm run build
Build output directory: dist
Root directory: /
Node.js version: 22.12.0 或更高
```

仓库内已加入：

- `wrangler.toml`：声明 Pages 输出目录
- `public/_headers`：基础安全响应头和 `_astro` 静态资源长期缓存
- `src/pages/robots.txt.ts`：根据 `PUBLIC_SITE_URL` 自动生成 sitemap 地址
- `src/pages/sitemap.xml.ts`：自动生成 sitemap
- `src/pages/rss.xml.ts`：自动生成 RSS

## 3. 环境变量说明

Cloudflare Pages 需要在项目的 Settings -> Environment variables 中配置：

```text
PUBLIC_SITE_URL
PUBLIC_SUPABASE_URL
PUBLIC_SUPABASE_ANON_KEY
NODE_VERSION
```

推荐值：

```env
PUBLIC_SITE_URL="https://example.com"
PUBLIC_SUPABASE_URL="https://你的项目.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="你的 Supabase anon key"
NODE_VERSION="22.12.0"
```

说明：

- `PUBLIC_SITE_URL` 用于 canonical、OpenGraph、RSS、sitemap 和 robots
- `PUBLIC_SUPABASE_URL` 用于浏览器端连接 Supabase Auth
- `PUBLIC_SUPABASE_ANON_KEY` 是 Supabase 公开 anon key，可以放在前端
- `NODE_VERSION` 确保 Cloudflare Pages 使用兼容的 Node 版本

Production 和 Preview 环境都可以配置同一套 Supabase 变量；如果你希望预览环境使用独立 Supabase 项目，也可以分别配置。

## 4. Supabase 环境变量配置

在 Supabase 控制台确认：

- Authentication -> Providers 启用 GitHub
- Authentication -> Providers 启用 Google
- Authentication -> Providers 启用 Email
- Site URL 设置为最终站点地址
- Redirect URLs 加入本地和线上登录地址

本地开发：

```text
http://127.0.0.1:4321/login/
http://localhost:4321/login/
```

线上生产：

```text
https://example.com/login/
https://www.example.com/login/
```

最终只保留你实际使用的 `.com` 地址即可。OAuth 回调必须和页面里的 `/login/` 路径一致。

## 5. 部署步骤

1. 把项目推送到 GitHub 仓库。
2. 在 Cloudflare Dashboard 创建 Pages 项目。
3. 连接 GitHub 仓库。
4. 构建配置选择 Astro，或手动填写：
   - Build command: `npm run build`
   - Output directory: `dist`
5. 在 Environment variables 中添加：
   - `PUBLIC_SITE_URL`
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - `NODE_VERSION`
6. 点击 Deploy。
7. 部署完成后访问 Cloudflare Pages 分配的 `*.pages.dev` 地址。
8. 检查：
   - `/`
   - `/blog/`
   - `/tools/`
   - `/login/`
   - `/rss.xml`
   - `/sitemap.xml`
   - `/robots.txt`

## 6. `.com` 域名绑定步骤

在 Cloudflare Pages 项目中：

1. 进入 Custom domains。
2. 添加你的 `.com` 域名，例如 `example.com`。
3. 根据你的域名策略决定是否添加 `www.example.com`。
4. 如果域名 DNS 已托管在 Cloudflare，Cloudflare 会自动创建所需 DNS 记录。
5. 如果域名 DNS 不在 Cloudflare，需要按提示添加 CNAME，或把域名 nameserver 切换到 Cloudflare。
6. 等待证书签发完成，确认 HTTPS 状态正常。
7. 回到 Pages 环境变量，把 `PUBLIC_SITE_URL` 改成最终主域名。
8. 在 Supabase Redirect URLs 中加入最终域名的 `/login/` 地址。
9. 重新触发一次 Cloudflare Pages 部署，让 canonical、RSS、sitemap、robots 和 OpenGraph 全部使用新域名。

建议只选择一个主域名：

- 方案 A：`https://example.com`
- 方案 B：`https://www.example.com`

另一个域名做跳转即可，避免 SEO canonical 分裂。

const siteUrl = (import.meta.env.PUBLIC_SITE_URL ?? "https://example.com").replace(/\/$/, "");

export const site = {
  name: "李明的技术手记",
  description: "记录前端工程、云端部署、开发工具与长期主义技术实践。",
  url: siteUrl,
  author: "李明",
  socialPreview: "/og.svg",
  nav: [
    { label: "首页", href: "/" },
    { label: "博客", href: "/blog/" },
    { label: "标签", href: "/tags/" },
    { label: "关于", href: "/about/" },
    { label: "工具", href: "/tools/" },
  ],
};

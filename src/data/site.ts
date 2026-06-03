const siteUrl = (import.meta.env.PUBLIC_SITE_URL ?? "https://example.com").replace(/\/$/, "");

export const site = {
  name: "happy,for you",
  brandName: "happy,for you",
  avatar: "/头像1.jpeg",
  description: "记录日常片段、喜欢的东西和慢慢整理好的生活小事。",
  url: siteUrl,
  author: "happy,for you",
  startDate: "2026-05-20",
  socialPreview: "/og.svg",
  nav: [
    { label: "首页", href: "/" },
    { label: "日常", href: "/tools/" },
    { label: "分享", href: "/share/" },
    { label: "关于", href: "/about/" },
  ],
};

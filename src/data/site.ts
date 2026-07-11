const siteUrl = (import.meta.env.PUBLIC_SITE_URL ?? "https://example.com").replace(/\/$/, "");

export const site = {
  name: "haven,for you",
  brandName: "haven,for you",
  avatar: "/头像1.jpeg",
  description: "记录随笔片段、喜欢的东西和慢慢整理好的生活小事。",
  url: siteUrl,
  author: "haven,for you",
  startDate: "2026-05-20",
  socialPreview: "/og.svg",
  nav: [
    { label: "首页", href: "/" },
    { label: "随笔", href: "/tools/" },
    { label: "分享", href: "/share/" },
    { label: "学习", href: "/study/" },
    { label: "关于", href: "/about/" },
  ],
};

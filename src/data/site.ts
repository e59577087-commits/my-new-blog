const siteUrl = (import.meta.env.PUBLIC_SITE_URL ?? "https://example.com").replace(/\/$/, "");

export const site = {
  name: "happy,for you",
  brandName: "happy,for you",
  avatar: "/avatar.svg",
  description: "记录日常片段、喜欢的东西和慢慢整理好的生活小事。",
  url: siteUrl,
  author: "happy,for you",
  socialPreview: "/og.svg",
  nav: [
    { label: "首页", href: "/" },
    { label: "日记", href: "/blog/" },
    { label: "标签", href: "/tags/" },
    { label: "关于", href: "/about/" },
    { label: "日常", href: "/tools/" },
  ],
};

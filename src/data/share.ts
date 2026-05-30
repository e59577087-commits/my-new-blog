export type ShareItem = {
  slug: string;
  title: string;
  category: string;
  description: string;
  content: string;
  screenshot: string;
  tags: string[];
  date: string;
  links: {
    label: string;
    href: string;
  }[];
};

export const shareItems: ShareItem[] = [
  {
    slug: "hello-world",
    title: "你好，世界",
    category: "随笔",
    description: "这是分享页面的第一篇文章，以后这里会记录一些想分享的东西。",
    content: "## 欢迎\n\n这是一个新的开始。分享页面将会记录一些有趣的东西，可能是读书笔记、生活感悟，或者任何想与他人分享的内容。\n\n敬请期待更多内容。",
    screenshot: "/tools/astro.svg",
    tags: ["随笔", "开始"],
    date: "2026-05-30",
    links: [
      { label: "首页", href: "/" },
    ],
  },
];

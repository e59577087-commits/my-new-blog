export type ShareItem = {
  slug: string;
  title: string;
  category: string;
  description: string;
  content: string;
  screenshot: string;
  tags: string[];
  date: string;
  pinned?: boolean;
  links: {
    label: string;
    href: string;
  }[];
};

export const shareItems: ShareItem[] = [
  {
    slug: "test-article",
    title: "测试文章",
    category: "测试",
    description: "此篇用于测试。",
    content: "此篇用于测试。",
    screenshot: "/1-960.webp",
    tags: ["测试"],
    date: "2026-06-03",
    links: [],
  },
];

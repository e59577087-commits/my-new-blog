export type Tool = {
  slug: string;
  name: string;
  category: string;
  description: string;
  screenshot: string;
  tags: string[];
  date: string;
  links: {
    label: string;
    href: string;
  }[];
};

export const tools: Tool[] = [
  {
    slug: "test-article",
    name: "测试文章",
    category: "测试",
    description: "此篇用于测试。",
    screenshot: "/1.png",
    tags: ["测试"],
    date: "2026-06-03",
    links: [
      {
        label: "查看文章",
        href: "/articles/test-article/",
      },
    ],
  },
];

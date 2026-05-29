export type Tool = {
  name: string;
  category: string;
  description: string;
  url: string;
  github: string;
  download: string;
  screenshot: string;
  tags: string[];
};

export const tools: Tool[] = [
  {
    name: "Astro",
    category: "静态站点",
    description: "用于构建内容优先的网站，默认输出轻量、快速、适合部署到 Cloudflare Pages。",
    url: "https://astro.build",
    github: "https://github.com/withastro/astro",
    download: "https://docs.astro.build/zh-cn/install-and-setup/",
    screenshot: "/tools/astro.svg",
    tags: ["SSG", "Markdown", "组件"],
  },
  {
    name: "TailwindCSS",
    category: "界面系统",
    description: "用原子类快速组织一致的间距、排版、颜色和响应式布局。",
    url: "https://tailwindcss.com",
    github: "https://github.com/tailwindlabs/tailwindcss",
    download: "https://tailwindcss.com/docs/installation",
    screenshot: "/tools/tailwindcss.svg",
    tags: ["CSS", "设计系统", "暗色模式"],
  },
  {
    name: "Cloudflare Pages",
    category: "部署",
    description: "面向前端项目的全球静态托管平台，适合个人博客和文档站。",
    url: "https://pages.cloudflare.com",
    github: "https://github.com/cloudflare",
    download: "https://developers.cloudflare.com/pages/get-started/",
    screenshot: "/tools/cloudflare-pages.svg",
    tags: ["CDN", "CI", "边缘网络"],
  },
  {
    name: "Obsidian",
    category: "写作",
    description: "本地优先的 Markdown 知识库，用于沉淀选题、草稿和阅读笔记。",
    url: "https://obsidian.md",
    github: "https://github.com/obsidianmd",
    download: "https://obsidian.md/download",
    screenshot: "/tools/obsidian.svg",
    tags: ["Markdown", "知识库", "写作流"],
  },
];

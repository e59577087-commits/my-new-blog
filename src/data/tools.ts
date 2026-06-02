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

export const tools: Tool[] = [];

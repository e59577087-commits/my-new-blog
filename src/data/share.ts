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

export const shareItems: ShareItem[] = [];

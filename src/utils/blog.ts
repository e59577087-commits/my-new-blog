import type { CollectionEntry } from "astro:content";

export type BlogPost = CollectionEntry<"blog">;

export const getPostSlug = (post: BlogPost) => post.id.replace(/\.md$/, "");

export const getPostUrl = (post: BlogPost) => `/blog/${getPostSlug(post)}/`;

export const getTagUrl = (tag: string) => `/tags/${tag}/`;

export const isPublished = (post: BlogPost) => !post.data.draft;

export const sortPostsByDate = (posts: BlogPost[]) =>
  [...posts].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

export const formatChineseDate = (date: Date) =>
  new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);

export const formatShortChineseDate = (date: Date) =>
  new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);

export const getReadingTime = (post: BlogPost) => {
  const body = post.body ?? "";
  const withoutCode = body.replace(/```[\s\S]*?```/g, "");
  const cjkChars = withoutCode.match(/[\u4e00-\u9fa5]/g)?.length ?? 0;
  const latinWords = withoutCode.match(/[A-Za-z0-9_]+/g)?.length ?? 0;
  const minutes = Math.max(1, Math.ceil((cjkChars + latinWords) / 350));

  return `${minutes} 分钟阅读`;
};

export const getAllTags = (posts: BlogPost[]) =>
  Array.from(new Set(posts.flatMap((post) => post.data.tags))).sort((a, b) => a.localeCompare(b, "zh-CN"));

export const getAdjacentPosts = (posts: BlogPost[], currentId: string) => {
  const sortedPosts = sortPostsByDate(posts);
  const currentIndex = sortedPosts.findIndex((post) => post.id === currentId);

  return {
    previousPost: sortedPosts[currentIndex + 1],
    nextPost: sortedPosts[currentIndex - 1],
  };
};

import type { CollectionEntry } from "astro:content";

export type Article = CollectionEntry<"articles">;

export const getArticleSlug = (article: Article) => article.id.replace(/\.md$/, "");

export const getArticleUrl = (article: Article) => `/articles/${getArticleSlug(article)}/`;

export const isPublishedArticle = (article: Article) => !article.data.draft;

export const sortArticlesByDate = (articles: Article[]) =>
  [...articles].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

export const formatArticleDate = (date: Date) =>
  new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);

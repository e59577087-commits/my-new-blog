import { getCollection, type CollectionEntry } from "astro:content";

export type Article = CollectionEntry<"articles">;

const articleModules = import.meta.glob("../content/articles/**/*.md");

export const getArticleSlug = (article: Article) => article.id.replace(/\.md$/, "");

export const getArticleUrl = (article: Article) => `/articles/${getArticleSlug(article)}/`;

export const isPublishedArticle = (article: Article) => !article.data.draft;

export const sortArticlesByDate = (articles: Article[]) =>
  [...articles].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

export const getPublishedArticles = async () => {
  if (Object.keys(articleModules).length === 0) return [];

  return sortArticlesByDate((await getCollection("articles")).filter(isPublishedArticle));
};

export const formatArticleDate = (date: Date) =>
  new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);

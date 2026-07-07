import { getCollection, type CollectionEntry } from "astro:content";

export type Article = CollectionEntry<"articles">;
export type Section = "article" | "essay" | "share" | "study";

// cover 缺省时的默认封面,见 public/covers/default.svg
export const DEFAULT_COVER = "/covers/default.svg";
export const coverOrDefault = (cover?: string): string => cover ?? DEFAULT_COVER;

const articleModules = import.meta.glob("../content/articles/**/*.md");

export const getArticleSlug = (article: Article) => article.id.replace(/\.md$/, "");

export const getEntryUrl = (article: Article) => {
  const slug = getArticleSlug(article);
  switch (article.data.section) {
    case "essay":
      return `/tools/${slug}/`;
    case "share":
      return `/share/${slug}/`;
    case "study":
      return `/study/${slug}/`;
    default:
      return `/articles/${slug}/`;
  }
};

export const getSectionLabel = (article: Article) => {
  const { section, category } = article.data;
  if (section === "essay") return category ? `随笔 / ${category}` : "随笔";
  if (section === "share") return category ? `分享 / ${category}` : "分享";
  if (section === "study") return category ? `学习 / ${category}` : "学习";
  return "文章";
};

export const isPublishedArticle = (article: Article) => !article.data.draft;

export const sortArticlesByDate = (articles: Article[]) =>
  [...articles].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

export const getPublishedArticles = async () => {
  if (Object.keys(articleModules).length === 0) return [];

  return sortArticlesByDate((await getCollection("articles")).filter(isPublishedArticle));
};

export const getPublishedBySection = async (section: Section) =>
  (await getPublishedArticles()).filter((article) => article.data.section === section);

export const formatArticleDate = (date: Date) =>
  new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);

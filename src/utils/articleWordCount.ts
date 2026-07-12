type ArticleBody = {
  body?: string;
};

const normalizeMarkdown = (body: string) => body
  .replace(/<!--[\s\S]*?-->/g, " ")
  .replace(/```[^\n]*\n/g, " ")
  .replace(/```/g, " ")
  .replace(/!\[\[.*?\]\]/g, " ")
  .replace(/!\[([^\]]*)\]\([^)]*\)/g, " $1 ")
  .replace(/\[([^\]]+)\]\([^)]*\)/g, " $1 ")
  .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target, label) => ` ${label ?? target} `)
  .replace(/^\s*\[[^\]]+\]:\s+\S+.*$/gm, " ")
  .replace(/<[^>]*>/g, " ")
  .replace(/https?:\/\/\S+/g, " ")
  .replace(/&(?:#\d+|#x[\da-f]+|[a-z][\da-z]+);/gi, " ")
  .replace(/[`*_~>#|=+\-:;,.!?，。！？；：“”‘’（）()[\]{}\\/]/g, " ");

const wordTokenPattern = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]|[\p{L}\p{N}]+/gu;

export const countArticleWords = (body = ""): number =>
  normalizeMarkdown(body).match(wordTokenPattern)?.length ?? 0;

export const countArticlesWords = (articles: readonly ArticleBody[]): number =>
  articles.reduce((total, article) => total + countArticleWords(article.body), 0);

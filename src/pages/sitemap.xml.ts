import { getCollection } from "astro:content";
import { site } from "../data/site";
import { getArticleUrl, isPublishedArticle, sortArticlesByDate } from "../utils/articles";

const staticRoutes = ["/", "/about/", "/tools/", "/share/", "/login/"];

export async function GET() {
  const articles = sortArticlesByDate((await getCollection("articles")).filter(isPublishedArticle));
  const articleRoutes = articles.map(getArticleUrl);

  const urls = [...staticRoutes, ...articleRoutes]
    .map((route) => {
      const loc = new URL(route, site.url).toString();

      return `
  <url>
    <loc>${loc}</loc>
  </url>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}

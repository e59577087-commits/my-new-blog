import { getCollection } from "astro:content";
import { site } from "../data/site";
import { getAllTags, getPostUrl, getTagUrl, isPublished, sortPostsByDate } from "../utils/blog";

const staticRoutes = ["/", "/blog/", "/tags/", "/about/", "/tools/", "/login/", "/rss.xml"];

export async function GET() {
  const posts = sortPostsByDate((await getCollection("blog")).filter(isPublished));
  const postRoutes = posts.map(getPostUrl);
  const tagRoutes = getAllTags(posts).map(getTagUrl);

  const urls = [...staticRoutes, ...postRoutes, ...tagRoutes]
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

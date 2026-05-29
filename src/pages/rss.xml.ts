import { getCollection } from "astro:content";
import { site } from "../data/site";
import { getPostUrl, isPublished, sortPostsByDate } from "../utils/blog";

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export async function GET() {
  const posts = sortPostsByDate((await getCollection("blog")).filter(isPublished));

  const items = posts
    .map((post) => {
      const url = new URL(getPostUrl(post), site.url).toString();
      const categories = post.data.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join("");

      return `
    <item>
      <title>${escapeXml(post.data.title)}</title>
      <description>${escapeXml(post.data.description)}</description>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${post.data.date.toUTCString()}</pubDate>
      ${categories}
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(site.name)}</title>
    <description>${escapeXml(site.description)}</description>
    <link>${site.url}</link>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}

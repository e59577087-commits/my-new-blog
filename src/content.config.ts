import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const articles = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/articles" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.date(),
  tags: z.array(z.string()).default([]),
  cover: z.string(),
    section: z.enum(["article", "essay", "share", "study"]).default("article"),
  category: z.string().optional(),
  pinned: z.boolean().default(false),
  draft: z.boolean().default(false),
  links: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
  }),
});

export const collections = { articles };

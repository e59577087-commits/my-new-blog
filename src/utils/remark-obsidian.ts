// Obsidian 兼容 remark 插件:把 ![[图片]] 与 [[双链]] 转成标准 markdown。
// - 图片:解析到 public/ 根(取 basename),支持 Obsidian 的 |尺寸 后缀。
// - 双链:模块加载时(配置阶段)直接读 src/content/articles 目录、解析 frontmatter,
//   建「笔记名 → 真实 URL」表,按目标笔记的实际板块拼地址(essay→/tools/ 等);
//   查不到时回退到 /articles/<slug>/。URL 规则与 utils/articles.ts 的 getEntryUrl 一致。
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import type { Plugin } from "unified";
import type { Root, Text, Image, Link, PhrasingContent, Parent } from "mdast";
import { visit } from "unist-util-visit";

// articles 目录(相对本文件定位,不依赖 CWD)
const ARTICLES_DIR = fileURLToPath(new URL("../content/articles", import.meta.url));

// 同时匹配图片嵌入 ![[...]](组1)与双链 [[...]](组2)
const PATTERN = /!\[\[([^\]]+?)\]\]|\[\[([^\]]+?)\]\]/g;

const splitOnPipe = (s: string): [string, string | undefined] => {
  const i = s.indexOf("|");
  return i === -1 ? [s, undefined] : [s.slice(0, i), s.slice(i + 1)];
};

const basename = (p: string): string => p.split(/[\\/]/).pop() ?? p;

// 图片目标可能是 文件夹/图片.png,统一取 basename 指向 public 根
const toImgSrc = (target: string): string => `/${basename(target).trim()}`;

const DEFAULT_IMAGE_WIDTH = "150";

const parseImageSize = (meta?: string): Record<string, string> | undefined => {
  const value = meta?.trim();
  if (!value) return { width: DEFAULT_IMAGE_WIDTH };
  const m = /^(\d+)(?:x(\d+))?$/.exec(value);
  if (!m) return { width: DEFAULT_IMAGE_WIDTH };
  return m[2] ? { width: m[1], height: m[2] } : { width: m[1] };
};

// 查不到目标笔记时的回退地址
const fallbackHref = (target: string): string => `/articles/${target.trim()}/`;

// 极简 frontmatter 解析:只取 section(默认 article)
const parseSection = (content: string): string => {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content);
  if (!m) return "article";
  for (const line of m[1].split(/\r?\n/)) {
    const sm = /^\s*section\s*:\s*("?)([^"\n#]+?)\1\s*(?:#.*)?$/.exec(line);
    if (sm) return sm[2].trim();
  }
  return "article";
};

// 与 utils/articles.ts 的 getEntryUrl 保持一致的板块→URL 映射
const entryUrl = (slug: string, section: string): string => {
  switch (section) {
    case "essay": return `/tools/${slug}/`;
    case "share": return `/share/${slug}/`;
    case "study": return `/study/${slug}/`;
    default: return `/articles/${slug}/`;
  }
};

interface LinkMap { bySlug: Map<string, string>; byBasename: Map<string, string>; }

// 模块加载时直接读 articles 目录建表(不依赖 astro:content 虚拟模块)
const buildLinkMap = (): LinkMap => {
  const bySlug = new Map<string, string>();
  const byBasename = new Map<string, string>();
  let entries: string[] = [];
  try {
    entries = readdirSync(ARTICLES_DIR, { recursive: true, encoding: "utf8" }) as unknown as string[];
  } catch {
    entries = [];
  }
  for (const rel of entries) {
    const norm = String(rel).replace(/\\/g, "/");
    if (!norm.endsWith(".md")) continue;
    const slug = norm.replace(/\.md$/, "");
    let section = "article";
    try {
      section = parseSection(readFileSync(join(ARTICLES_DIR, norm), "utf8"));
    } catch {
      section = "article";
    }
    const url = entryUrl(slug, section);
    bySlug.set(slug, url);
    byBasename.set(basename(slug), url);
  }
  return { bySlug, byBasename };
};

const resolveHref = (target: string, linkMap: LinkMap): string => {
  const t = target.trim();
  return linkMap.bySlug.get(t) ?? linkMap.byBasename.get(basename(t)) ?? fallbackHref(target);
};

export const remarkObsidian: Plugin<[], Root> = () => (tree) => {
  const linkMap = buildLinkMap();

  visit(tree, "text", (node: Text, index, parent: Parent | undefined) => {
    if (!parent || typeof index !== "number") return;
    const value = node.value;
    if (!value.includes("[[")) return;

    PATTERN.lastIndex = 0;
    const out: PhrasingContent[] = [];
    let last = 0;
    let matched = false;
    let m: RegExpExecArray | null;

    while ((m = PATTERN.exec(value)) !== null) {
      const [whole, embed, wiki] = m;
      if (m.index > last) {
        out.push({ type: "text", value: value.slice(last, m.index) });
      }
      if (embed !== undefined) {
        const [path, size] = splitOnPipe(embed);
        const img: Image = { type: "image", url: toImgSrc(path), alt: basename(path).trim() };
        const hProperties = parseImageSize(size);
        if (hProperties) img.data = { hProperties };
        out.push(img);
      } else {
        const [target, alias] = splitOnPipe(wiki);
        // 支持 Obsidian 锚点: [[笔记#标题]] 或 [[笔记#^块ID]]
        const hashIndex = target.indexOf("#");
        const base = hashIndex === -1 ? target : target.slice(0, hashIndex);
        const hash = hashIndex === -1 ? "" : target.slice(hashIndex);
        const link: Link = {
          type: "link",
          url: resolveHref(base, linkMap) + hash,
          children: [{ type: "text", value: (alias ?? target).trim() }],
        };
        out.push(link);
      }
      last = m.index + whole.length;
      matched = true;
    }

    if (!matched) return;
    if (last < value.length) out.push({ type: "text", value: value.slice(last) });
    parent.children.splice(index, 1, ...out);
  });
};

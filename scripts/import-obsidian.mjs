// 从 Obsidian vault 导入笔记到博客 articles 目录
// 用法: node scripts/import-obsidian.mjs <笔记路径> [选项]
//
// 选项:
//   --vault <path>     Obsidian vault 根目录 (默认: 从源文件向上找 .obsidian)
//   --section <name>   article | essay | share | study (默认: article)
//   --title <title>    覆盖标题 (默认: 文件名)
//   --draft            标记为草稿
//   --pinned           置顶文章
//   --dry-run          仅预览,不写入文件
//
// 示例:
//   node scripts/import-obsidian.mjs ~/obsidian/笔记/我的文章.md --section essay
//   node scripts/import-obsidian.mjs ~/obsidian/笔记/我的文章.md --vault ~/obsidian --draft

import { readFileSync, writeFileSync, copyFileSync, statSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { basename, join, dirname, resolve, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = resolve(__dirname, "..", "src", "content", "articles");
const PUBLIC_DIR = resolve(__dirname, "..", "public");

// ========== 参数解析 ==========

function parseArgs(args) {
  const positional = [];
  const options = { section: "article", draft: false, pinned: false, vault: null, title: null, dryRun: false };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--vault": options.vault = args[++i]; break;
      case "--section": options.section = args[++i]; break;
      case "--title": options.title = args[++i]; break;
      case "--draft": options.draft = true; break;
      case "--pinned": options.pinned = true; break;
      case "--dry-run": options.dryRun = true; break;
      default:
        if (args[i].startsWith("--")) {
          console.error(`未知选项: ${args[i]}`);
          process.exit(1);
        }
        positional.push(args[i]);
    }
  }

  if (positional.length === 0) {
    console.error("用法: node scripts/import-obsidian.mjs <笔记路径> [选项]");
    console.error("需要指定 Obsidian 笔记的 .md 文件路径");
    process.exit(1);
  }

  return { source: resolve(positional[0]), options };
}

function validateOptions(options) {
  const validSections = ["article", "essay", "share", "study"];
  if (!validSections.includes(options.section)) {
    console.error(`无效的 section: "${options.section}", 可选值: ${validSections.join(", ")}`);
    process.exit(1);
  }
}

// ========== Vault 发现 ==========

function findVaultRoot(sourceFile) {
  let dir = dirname(sourceFile);
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, ".obsidian"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

// ========== Frontmatter 解析与生成 ==========

function parseFrontmatter(content) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content);
  if (!m) return { data: {}, body: content };

  const raw = m[1];
  const body = content.slice(m[0].length);
  const data = {};

  // 解析简单 YAML (单行 key: value, 支持字符串、数组、布尔)
  const lines = raw.split(/\r?\n/);
  let currentKey = null, currentArray = null;

  for (const line of lines) {
    const arrayItem = /^\s+-\s+(.+)/.exec(line);
    if (arrayItem && currentKey) {
      if (!data[currentKey]) data[currentKey] = [];
      data[currentKey].push(arrayItem[1].replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1").trim());
      continue;
    }

    const kv = /^\s*(\w[\w-]*)\s*:\s*(.*)/.exec(line);
    if (kv) {
      currentKey = kv[1];
      let value = kv[2].trim();
      // 去掉行尾注释
      value = value.replace(/\s*#.*$/, "");
      // 去掉引号
      value = value.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
      // 布尔值
      if (value === "true") value = true;
      else if (value === "false") value = false;
      else if (/^\d+$/.test(value)) value = parseInt(value, 10);

      data[currentKey] = value;
      currentArray = null;
    }
  }

  return { data, body };
}

function generateFrontmatter({ title, date, tags, cover, section, draft, pinned, description }) {
  const lines = ["---"];
  lines.push(`title: "${title}"`);
  lines.push(`description: "${description ?? ""}"`);
  lines.push(`date: ${formatDate(date)}`);
  if (tags && tags.length > 0) {
    lines.push("tags:");
    for (const tag of tags) lines.push(`  - ${tag}`);
  } else {
    lines.push("tags: []");
  }
  if (cover) lines.push(`cover: "${cover}"`);
  lines.push(`section: ${section}`);
  lines.push(`draft: ${draft}`);
  lines.push(`pinned: ${pinned}`);
  lines.push("---");
  lines.push("");
  return lines.join("\n");
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ========== 图片搜索与复制 ==========

// Obsidian 常见的附件目录名
const ATTACHMENT_DIRS = [
  "attachments", "assets", "images", "media", "files", "res",
  "_attachments", "_assets", "_images", "_media",
  "Pasted image", "Pasted images",
  "附件", "图片", "资源",
];

function findImage(imageName, sourceDir, vaultRoot) {
  // 1. 相对于笔记所在目录 (处理 ![[subfolder/image.png]])
  const relPath = join(sourceDir, imageName);
  if (existsSync(relPath)) return relPath;

  // 2. 只看 basename,在笔记同目录找
  const base = basename(imageName);
  const sameDir = join(sourceDir, base);
  if (sameDir !== relPath && existsSync(sameDir)) return sameDir;

  // 3. 在常见附件目录中找
  if (vaultRoot) {
    for (const dir of ATTACHMENT_DIRS) {
      const attachDir = join(vaultRoot, dir);
      if (!existsSync(attachDir)) continue;
      // 直接匹配
      const direct = join(attachDir, base);
      if (existsSync(direct)) return direct;
      // 子目录匹配 (处理 ![[subfolder/image.png]] 在 attachments 中)
      const subPath = join(attachDir, imageName);
      if (existsSync(subPath)) return subPath;
      // 浅层搜索 (1层)
      try {
        for (const entry of readdirSync(attachDir)) {
          const full = join(attachDir, entry);
          if (statSync(full).isDirectory()) {
            const nested = join(full, base);
            if (existsSync(nested)) return nested;
          }
        }
      } catch { /* skip */ }
    }
  }

  // 4. 在 vault 根目录找
  if (vaultRoot) {
    const vaultDirect = join(vaultRoot, base);
    if (existsSync(vaultDirect)) return vaultDirect;
  }

  return null;
}

function findImageRefs(body) {
  const refs = [];
  const re = /!\[\[([^\]]+?)\]\]/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const [full, path] = m;
    const cleanPath = path.split("|")[0].trim(); // 去掉 |尺寸 后缀
    refs.push({ full, path: cleanPath, index: m.index });
  }
  return refs;
}

// ========== 主流程 ==========

function main() {
  const args = process.argv.slice(2);
  const { source, options } = parseArgs(args);
  validateOptions(options);

  if (!existsSync(source)) {
    console.error(`文件不存在: ${source}`);
    process.exit(1);
  }

  // 发现 vault 根目录
  const vaultRoot = options.vault ? resolve(options.vault) : findVaultRoot(source);
  if (!vaultRoot) {
    console.warn("⚠ 未找到 Obsidian vault 根目录 (未发现 .obsidian 文件夹)");
    console.warn("  图片搜索将仅限于笔记所在目录。可用 --vault 手动指定。");
  } else {
    console.log(`📁 Vault 根目录: ${vaultRoot}`);
  }

  // 读取源文件
  const rawContent = readFileSync(source, "utf8");
  const { data: obsidianFrontmatter, body } = parseFrontmatter(rawContent);

  // 确定基本元数据
  const fileName = basename(source, ".md");
  const fileStat = statSync(source);
  const title = options.title ?? obsidianFrontmatter.title ?? fileName;
  const date = obsidianFrontmatter.date
    ? new Date(obsidianFrontmatter.date)
    : fileStat.mtime;
  const tags = obsidianFrontmatter.tags
    ? (Array.isArray(obsidianFrontmatter.tags) ? obsidianFrontmatter.tags : [obsidianFrontmatter.tags])
    : [];

  // 自动提取描述 (body 的第一段非空文本)
  let description = obsidianFrontmatter.description ?? "";
  if (!description) {
    const firstPara = body.split(/\r?\n\r?\n/).find(p => {
      const t = p.trim();
      return t.length > 10 && !t.startsWith("#") && !t.startsWith("![") && !t.startsWith("[");
    });
    if (firstPara) {
      description = firstPara.replace(/\r?\n/g, " ").trim().slice(0, 200);
    }
  }

  // 查找图片引用
  const imageRefs = findImageRefs(body);
  console.log(`🖼  找到 ${imageRefs.length} 个图片引用`);

  // 确保目标目录存在
  if (!options.dryRun) {
    mkdirSync(PUBLIC_DIR, { recursive: true });
    mkdirSync(ARTICLES_DIR, { recursive: true });
  }

  // 检查目标文件是否已存在
  const destFile = join(ARTICLES_DIR, `${fileName}.md`);
  if (existsSync(destFile) && !options.dryRun) {
    console.warn(`⚠ 目标文件已存在,将被覆盖: ${destFile}`);
  }

  // 复制图片到 public/, 并生成新的引用名称
  const slug = fileName;
  const imageMap = new Map(); // oldRef → newRef
  const copiedImages = [];

  for (const ref of imageRefs) {
    const imagePath = findImage(ref.path, dirname(source), vaultRoot);
    if (!imagePath) {
      console.warn(`  ⚠ 找不到图片: ${ref.path}`);
      continue;
    }

    const ext = extname(imagePath);
    const newName = `${slug}-${basename(ref.path, ext)}${ext}`;
    const destPath = join(PUBLIC_DIR, newName);

    if (!options.dryRun) {
      copyFileSync(imagePath, destPath);
    }
    copiedImages.push({ src: imagePath, dest: destPath, newName });
    // 引用中的 basename 替换为新名称 (remark-obsidian 只取 basename)
    imageMap.set(ref.path, newName);
    console.log(`  ✅ ${basename(imagePath)} → public/${newName}`);
  }

  // 替换 body 中的图片引用
  let processedBody = body;
  for (const ref of imageRefs) {
    const newName = imageMap.get(ref.path);
    if (!newName) continue;
    // 保留 |尺寸 后缀
    const pipeIndex = ref.path.indexOf("|");
    const suffix = pipeIndex === -1 ? "" : ref.path.slice(pipeIndex);
    processedBody = processedBody.replace(ref.full, `![[${newName}${suffix}]]`);
  }

  // 自动设置封面 (第一张图片)
  let cover = obsidianFrontmatter.cover ?? "";
  if (!cover && copiedImages.length > 0) {
    cover = `/${copiedImages[0].newName}`;
  }

  // 生成输出 frontmatter
  const frontmatter = generateFrontmatter({
    title,
    date,
    tags,
    cover,
    section: options.section,
    draft: options.draft,
    pinned: options.pinned,
    description,
  });

  const output = frontmatter + processedBody.trimStart();

  console.log("");
  console.log("📄 输出文件:", destFile);
  console.log("📋 Frontmatter 预览:");
  console.log(frontmatter);

  if (options.dryRun) {
    console.log("🔍 --dry-run 模式,未实际写入文件");
  } else {
    writeFileSync(destFile, output, "utf8");
    console.log("✅ 导入完成!");
    console.log("");
    console.log(`   下一步: npm run dev 预览,确认无误后提交发布。`);
  }
}

main();

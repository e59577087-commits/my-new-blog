import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const controllerPath = resolve(root, "src", "utils", "articleImageLightbox.ts");
const componentPath = resolve(root, "src", "components", "ArticleImageLightbox.astro");
const layoutPath = resolve(root, "src", "layouts", "ArticleLayout.astro");

const controllerModule = existsSync(controllerPath) ? await import(pathToFileURL(controllerPath)) : null;

test("selects informative article images without turning inline reactions into lightboxes", () => {
  assert.ok(controllerModule, "article image lightbox controller is missing");
  const { getArticleImageLightboxMode } = controllerModule;

  assert.equal(
    getArticleImageLightboxMode({ src: "/Screenshot_20260714_165555%201.jpg", alt: "Screenshot_20260714_165555 1.jpg", width: 100 }),
    "thumbnail",
    "small JPEG tutorial screenshots should remain compact but open in the lightbox",
  );
  assert.equal(getArticleImageLightboxMode({ src: "/霸王之卵.gif", alt: "霸王之卵.gif", width: 74 }), "off");
  assert.equal(getArticleImageLightboxMode({ src: "/大脑被羞辱.png", alt: "大脑被羞辱.png", width: 117 }), "off");
  assert.equal(getArticleImageLightboxMode({ src: "/diagram.webp", alt: "订阅导入流程" }), "block");
  assert.equal(getArticleImageLightboxMode({ src: "/diagram.svg", alt: "流程图" }), "off");
  assert.equal(getArticleImageLightboxMode({ src: "/photo.jpg", alt: "", preference: "on" }), "block", "explicit opt-in should win");
  assert.equal(getArticleImageLightboxMode({ src: "/photo.jpg", alt: "海边", preference: "off" }), "off", "explicit opt-out should win");
});

test("keeps explicitly sized tutorial screenshots inline when adding a lightbox", () => {
  assert.ok(controllerModule, "article image lightbox controller is missing");
  const { getArticleImageLightboxMode } = controllerModule;

  assert.equal(
    getArticleImageLightboxMode({
      src: "/QuickClipboard-90b5432cc26a1a49.png",
      alt: "QuickClipboard 常规设置",
      width: 250,
    }),
    "thumbnail",
  );
});

test("preserves a declared width when the lightbox is explicitly enabled", () => {
  assert.ok(controllerModule, "article image lightbox controller is missing");
  const { getArticleImageLightboxMode } = controllerModule;

  assert.equal(
    getArticleImageLightboxMode({ src: "/diagram.png", alt: "流程图", width: 250, preference: "on" }),
    "thumbnail",
  );
});

test("treats every non-content area as a dismissible lightbox backdrop", () => {
  assert.ok(controllerModule, "article image lightbox controller is missing");
  const { shouldCloseArticleImageLightboxFromTarget } = controllerModule;
  assert.equal(typeof shouldCloseArticleImageLightboxFromTarget, "function", "backdrop target detection is missing");

  const targetMatching = (matchedSelector) => ({
    closest(selectors) {
      return matchedSelector && selectors.split(", ").includes(matchedSelector) ? {} : null;
    },
  });

  assert.equal(shouldCloseArticleImageLightboxFromTarget(targetMatching(null)), true, "panel whitespace should close the viewer");
  assert.equal(shouldCloseArticleImageLightboxFromTarget(targetMatching("[data-lightbox-image]")), false, "clicking the image should keep the viewer open");
  assert.equal(shouldCloseArticleImageLightboxFromTarget(targetMatching("[data-lightbox-caption]")), false, "clicking the caption should keep the viewer open");
  assert.equal(shouldCloseArticleImageLightboxFromTarget(targetMatching("[data-lightbox-close]")), false, "the close button should handle its own click");
});

test("opens the native dialog with the selected image and restores focus after close", () => {
  assert.ok(controllerModule, "article image lightbox controller is missing");
  const { createArticleImageLightboxController } = controllerModule;

  class FakeDialog extends EventTarget {
    open = false;
    showModalCalls = 0;
    closeCalls = 0;

    showModal() {
      this.open = true;
      this.showModalCalls += 1;
    }

    close() {
      if (!this.open) return;
      this.open = false;
      this.closeCalls += 1;
      this.dispatchEvent(new Event("close"));
    }
  }

  const dialog = new FakeDialog();
  const preview = { src: "", alt: "" };
  const caption = { textContent: "", hidden: true };
  const trigger = { focusCalls: 0, focus() { this.focusCalls += 1; } };
  const openStates = [];
  const controller = createArticleImageLightboxController({
    dialog,
    preview,
    caption,
    onOpenChange: (open) => openStates.push(open),
  });

  controller.open({
    trigger,
    src: "/thumb.jpg",
    currentSrc: "/full.jpg",
    alt: "GKD 添加订阅界面",
    caption: "GKD 添加订阅界面",
  });

  assert.equal(dialog.open, true);
  assert.equal(dialog.showModalCalls, 1);
  assert.equal(preview.src, "/full.jpg");
  assert.equal(preview.alt, "GKD 添加订阅界面");
  assert.equal(caption.textContent, "GKD 添加订阅界面");
  assert.equal(caption.hidden, false);
  assert.deepEqual(openStates, [true]);

  dialog.dispatchEvent(new Event("cancel", { cancelable: true }));

  assert.equal(dialog.open, false, "Escape/cancel should close the dialog");
  assert.equal(trigger.focusCalls, 1, "focus should return to the image trigger");
  assert.deepEqual(openStates, [true, false]);
  controller.destroy();
});

test("mounts one accessible lightbox on every article page", () => {
  const component = existsSync(componentPath) ? readFileSync(componentPath, "utf8") : "";
  const layout = readFileSync(layoutPath, "utf8");

  assert.match(layout, /import ArticleImageLightbox from "\.\.\/components\/ArticleImageLightbox\.astro";/);
  assert.match(layout, /<ArticleImageLightbox\s*\/>/);
  assert.match(component, /<dialog[^>]*data-article-image-lightbox/);
  assert.match(component, /aria-label="关闭大图"/);
  assert.match(component, /showModal|controller\.open/);
  assert.match(component, /shouldCloseArticleImageLightboxFromTarget\(event\.target\)/, "all visual backdrop areas should close the viewer");
  assert.match(component, /astro:after-swap/, "view transitions should re-enhance article images");
});

test("keeps image triggers accessible without a visible zoom label", () => {
  const component = existsSync(componentPath) ? readFileSync(componentPath, "utf8") : "";

  assert.match(component, /trigger\.setAttribute\("aria-label",\s*`查看大图/, "image triggers lost their accessible label");
  assert.doesNotMatch(component, /article-image-zoom-label/, "the visible zoom label still covers article images");
});

test("uses the compact 8px reference radius for article images", () => {
  const component = existsSync(componentPath) ? readFileSync(componentPath, "utf8") : "";
  const triggerRule = component.match(/\.article-image-trigger\s*\{([^}]*)\}/)?.[1];
  const imageRule = component.match(/\.article-image-trigger\s*>\s*img\s*\{([^}]*)\}/)?.[1];

  assert.ok(triggerRule, "article image trigger rule is missing");
  assert.ok(imageRule, "article image rule is missing");
  assert.match(triggerRule, /--article-image-radius:\s*8px\s*;/, "the compact article image radius token is missing");
  assert.match(triggerRule, /border-radius:\s*var\(--article-image-radius\)\s*;/, "article image trigger does not use the compact radius");
  assert.match(imageRule, /border-radius:\s*var\(--article-image-radius\)\s*;/, "article images do not use the compact radius");
});

test("keeps the viewer touch-friendly, viewport-bound, and motion-sensitive", () => {
  const component = existsSync(componentPath) ? readFileSync(componentPath, "utf8") : "";

  assert.match(component, /max-inline-size:\s*92vw\s*;/, "enlarged images can overflow the viewport width");
  assert.match(component, /max-block-size:\s*84dvh\s*;/, "enlarged images can overflow the viewport height");
  assert.match(component, /min-inline-size:\s*3rem\s*;/, "close control is smaller than a comfortable touch target");
  assert.match(
    component,
    /trigger\.style\.setProperty\(\s*"--article-image-thumbnail-width",\s*`\$\{width\}px`\s*\)/,
    "thumbnail triggers do not receive the image's declared width",
  );
  assert.match(
    component,
    /inline-size:\s*min\(100%,\s*var\(--article-image-thumbnail-width,\s*18rem\)\)\s*;/,
    "thumbnail triggers do not respect the declared width while staying responsive",
  );
  assert.match(component, /@media\s*\(prefers-reduced-motion:\s*reduce\)/, "lightbox motion does not respect reduced-motion preferences");
});

test("keeps adjacent article thumbnails inline when space permits", () => {
  const component = existsSync(componentPath) ? readFileSync(componentPath, "utf8") : "";
  const rule = component.match(/\.article-image-trigger--thumbnail\s*\{([^}]*)\}/)?.[1];

  assert.ok(rule, "thumbnail trigger rule is missing");
  assert.match(rule, /display:\s*inline-block\s*;/, "thumbnail triggers still force their own rows");
  assert.match(rule, /vertical-align:\s*middle\s*;/, "adjacent thumbnails are not aligned consistently");
});

test("does not issue an empty preview-image request before the viewer opens", () => {
  const component = existsSync(componentPath) ? readFileSync(componentPath, "utf8") : "";
  assert.doesNotMatch(component, /data-lightbox-image\s+src=""/, "empty src can request the current document as an image");
});

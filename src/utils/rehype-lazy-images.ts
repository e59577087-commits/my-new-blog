import type { Element, Root } from "hast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

export const rehypeLazyImages: Plugin<[], Root> = () => (tree) => {
  visit(tree, "element", (node: Element) => {
    if (node.tagName !== "img") return;
    node.properties = {
      ...node.properties,
      loading: "lazy",
      decoding: "async",
    };
  });
};

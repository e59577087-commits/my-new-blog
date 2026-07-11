import type { Link, Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

const HTTP_URL = /^https?:\/\//i;

export const remarkExternalLinks: Plugin<[], Root> = () => (tree) => {
  visit(tree, "link", (node: Link) => {
    if (!HTTP_URL.test(node.url)) return;

    node.data = {
      ...node.data,
      hProperties: {
        ...node.data?.hProperties,
        target: "_blank",
        rel: "noopener noreferrer",
      },
    };
  });
};

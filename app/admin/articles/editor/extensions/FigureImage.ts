import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import FigureImageView from "../FigureImageView";

export type FigureAlign = "left" | "center" | "right" | "full";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    figureImage: {
      setFigureImage: (attrs: {
        src: string;
        alt?: string;
        caption?: string;
        align?: FigureAlign;
        width?: number;
      }) => ReturnType;
    };
  }
}

/**
 * An image with a caption, alignment, and a width, rendered as a real
 * <figure>/<figcaption> pair.
 *
 * The caption is an *attribute* edited through the node view's own input
 * rather than ProseMirror inline content. That's the key design decision
 * here: making the caption editable content means the node's content
 * schema has to compete with the <img> child during HTML parsing, which
 * breaks round-tripping the plain <img> tags already in the imported
 * WordPress articles. As an attribute, parsing is unambiguous — a bare
 * <img> and a full <figure> both land on this node cleanly.
 */
export const FigureImage = Node.create({
  name: "figureImage",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
      caption: { default: "" },
      align: { default: "center" as FigureAlign },
      // Percentage of the column. null means "natural size" so images
      // that predate this feature aren't force-stretched to full width.
      width: { default: null as number | null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure",
        // Priority above the bare-img rule so a <figure> is consumed whole
        // instead of its inner <img> matching first and orphaning the
        // caption.
        priority: 60,
        getAttrs: (element) => {
          const figure = element as HTMLElement;
          const img = figure.querySelector("img");
          if (!img) return false;
          const caption = figure.querySelector("figcaption")?.textContent ?? "";
          const alignClass = (["left", "center", "right", "full"] as const).find((a) =>
            figure.classList.contains(`align-${a}`)
          );
          const rawWidth = img.style.width || img.getAttribute("width") || "";
          const parsedWidth = /^(\d{1,3})%$/.exec(rawWidth);
          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt") ?? "",
            caption: caption.trim(),
            align: alignClass ?? "center",
            width: parsedWidth ? Number(parsedWidth[1]) : null,
          };
        },
      },
      {
        tag: "img[src]",
        getAttrs: (element) => {
          const img = element as HTMLImageElement;
          const rawWidth = img.style.width || "";
          const parsedWidth = /^(\d{1,3})%$/.exec(rawWidth);
          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt") ?? "",
            caption: "",
            align: "center",
            width: parsedWidth ? Number(parsedWidth[1]) : null,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, alt, caption, align, width } = HTMLAttributes as {
      src: string;
      alt: string;
      caption: string;
      align: FigureAlign;
      width: number | null;
    };

    const img = [
      "img",
      mergeAttributes({
        src,
        alt: alt || "",
        ...(width ? { style: `width: ${width}%` } : {}),
      }),
    ];

    // Only emit <figcaption> when there's actually a caption — an empty
    // one would render as a stray gap on the public article page.
    const children = caption ? [img, ["figcaption", {}, caption]] : [img];

    return ["figure", { class: `article-figure align-${align ?? "center"}` }, ...children];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FigureImageView);
  },

  addCommands() {
    return {
      setFigureImage:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});

export default FigureImage;

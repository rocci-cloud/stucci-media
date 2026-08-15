import { Node, mergeAttributes } from "@tiptap/core";

export type CalloutTone = "info" | "warning" | "danger" | "success";

export const CALLOUT_TONES: { value: CalloutTone; label: string }[] = [
  { value: "info", label: "Note" },
  { value: "warning", label: "Caution" },
  { value: "danger", label: "Alert" },
  { value: "success", label: "Confirmed" },
];

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (tone?: CalloutTone) => ReturnType;
      toggleCallout: (tone?: CalloutTone) => ReturnType;
      unsetCallout: () => ReturnType;
    };
  }
}

/**
 * A boxed aside — "Note", "Caution", "Alert", "Confirmed". Content is real
 * block content (not an attribute) so an editor can put multiple
 * paragraphs, a list, or a link inside one, which is the whole point of a
 * callout versus a styled blockquote.
 *
 * Rendered as <div class="callout callout-{tone}">, matching exactly what
 * lib/sanitize.ts allows through — the tone list here and the class
 * allowlist there must stay in step.
 */
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      tone: {
        default: "info" as CalloutTone,
        parseHTML: (element) => {
          const tone = CALLOUT_TONES.find((t) => element.classList.contains(`callout-${t.value}`));
          return tone?.value ?? "info";
        },
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div.callout" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const tone = (node.attrs.tone as CalloutTone) ?? "info";
    return ["div", mergeAttributes(HTMLAttributes, { class: `callout callout-${tone}` }), 0];
  },

  addCommands() {
    return {
      setCallout:
        (tone = "info") =>
        ({ commands }) =>
          commands.wrapIn(this.name, { tone }),
      toggleCallout:
        (tone = "info") =>
        ({ commands }) =>
          commands.toggleWrap(this.name, { tone }),
      unsetCallout:
        () =>
        ({ commands }) =>
          commands.lift(this.name),
    };
  },

  addKeyboardShortcuts() {
    return {
      // A callout is `defining`, so an empty trailing paragraph inside it
      // otherwise traps the cursor with no obvious way out.
      "Mod-Shift-c": () => this.editor.commands.toggleCallout(),
    };
  },
});

export default Callout;

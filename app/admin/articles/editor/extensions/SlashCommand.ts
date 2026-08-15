import { Extension, type Editor, type Range } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";

export type SlashItem = {
  id: string;
  title: string;
  hint: string;
  group: string;
  keywords: string[];
  run: (ctx: { editor: Editor; range: Range }) => void;
};

export type SlashPopupState = {
  items: SlashItem[];
  index: number;
  rect: DOMRect;
  // Carried on the state rather than reconstructed by the React menu:
  // mouse-selecting an item must go through the exact same command path
  // as pressing Enter, or the "/query" text it replaces would have to be
  // re-derived (and could drift out of sync with the plugin's own range).
  select: (index: number) => void;
};

/**
 * Bridge between the ProseMirror suggestion plugin (imperative, lives
 * inside the editor) and the React popup (declarative, rendered by
 * RichTextEditor). The extension is created once inside useEditor and
 * can't close over changing React state, so it writes through this stable
 * handle instead.
 */
export type SlashBridge = {
  setState: (state: SlashPopupState | null) => void;
};

export const slashCommandPluginKey = new PluginKey("slashCommand");

export type SlashCommandOptions = {
  bridge: SlashBridge;
  items: SlashItem[];
};

function filterItems(items: SlashItem[], query: string): SlashItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(q) || item.keywords.some((keyword) => keyword.includes(q))
  );
}

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: "slashCommand",

  addOptions() {
    return {
      bridge: { setState: () => {} },
      items: [],
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;

    return [
      Suggestion<SlashItem>({
        editor: this.editor,
        char: "/",
        pluginKey: slashCommandPluginKey,
        // Only offer commands at the start of an empty-ish block, so a "/"
        // typed mid-sentence (a URL, a date, "and/or") never hijacks
        // typing.
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from);
          return $from.parent.type.name === "paragraph" && $from.parent.textContent.trim().length <= 1;
        },
        items: ({ query }) => filterItems(options.items, query),
        command: ({ editor, range, props }) => props.run({ editor, range }),

        render: () => {
          // Selection index lives here, not in React: onKeyDown must decide
          // synchronously whether it consumed the key, and reading it back
          // out of React state would be a frame behind.
          let index = 0;
          let current: SlashItem[] = [];
          // onKeyDown's props carry only the event and the editor — no
          // clientRect and no command — so both are captured here from the
          // most recent onStart/onUpdate and reused while the menu is open.
          let rect: DOMRect | null = null;
          let command: ((item: SlashItem) => void) | null = null;

          const push = () => {
            if (!rect) {
              options.bridge.setState(null);
              return;
            }
            options.bridge.setState({
              items: current,
              index,
              rect,
              select: (i: number) => command?.(current[i]),
            });
          };

          return {
            onStart: (props) => {
              index = 0;
              current = props.items;
              rect = props.clientRect?.() ?? null;
              command = props.command;
              push();
            },
            onUpdate: (props) => {
              current = props.items;
              if (index >= current.length) index = Math.max(0, current.length - 1);
              rect = props.clientRect?.() ?? null;
              command = props.command;
              push();
            },
            onKeyDown: (props) => {
              if (current.length === 0) return false;

              if (props.event.key === "ArrowDown") {
                index = (index + 1) % current.length;
                push();
                return true;
              }
              if (props.event.key === "ArrowUp") {
                index = (index - 1 + current.length) % current.length;
                push();
                return true;
              }
              if (props.event.key === "Enter" || props.event.key === "Tab") {
                command?.(current[index]);
                return true;
              }
              if (props.event.key === "Escape") {
                options.bridge.setState(null);
                return true;
              }
              return false;
            },
            onExit: () => {
              rect = null;
              command = null;
              options.bridge.setState(null);
            },
          };
        },
      }),
    ];
  },
});

export default SlashCommand;

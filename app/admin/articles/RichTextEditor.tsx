"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent, BubbleMenu, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import {
  AlertTriangle,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Columns3,
  Heading2,
  Heading3,
  Heading4,
  ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
  Unlink,
  Video,
} from "lucide-react";
import { cn } from "../lib/cn";
import { Button } from "../components/ui/button";
import FigureImage from "./editor/extensions/FigureImage";
import Callout, { CALLOUT_TONES } from "./editor/extensions/Callout";
import Embed, { toEmbedUrl } from "./editor/extensions/Embed";
import SlashCommand, { type SlashBridge, type SlashItem, type SlashPopupState } from "./editor/extensions/SlashCommand";
import SlashMenu from "./editor/SlashMenu";
import MediaPickerDialog, { type PickedImage } from "./MediaPickerDialog";
import { uploadImage, suggestAltText, ALLOWED_IMAGE_TYPES } from "./upload-image";

function ToolbarButton({
  active,
  onClick,
  disabled,
  label,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn("h-8 w-8", active && "bg-[var(--admin-bg-subtle)] text-[var(--admin-primary)]")}
    >
      {children}
    </Button>
  );
}

function Divider() {
  return <div className="mx-1 h-5 w-px shrink-0 bg-[var(--admin-border)]" />;
}

export default function RichTextEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (html: string) => void;
}) {
  const [slashState, setSlashState] = useState<SlashPopupState | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Stable handle the ProseMirror suggestion plugin writes through. The
  // extension is constructed once inside useEditor and can't close over
  // React state, so it gets this object instead (see SlashCommand.ts).
  const slashBridge = useMemo<SlashBridge>(() => ({ setState: setSlashState }), []);

  // handlePaste/handleDrop are captured when the editor is constructed, so
  // they can't reference the `editor` binding directly — it doesn't exist
  // yet at that point. They read through this ref, which is filled in
  // immediately after useEditor returns.
  const editorRef = useRef<Editor | null>(null);

  const insertImage = useCallback((editor: Editor, image: PickedImage) => {
    editor.chain().focus().setFigureImage({ src: image.url, alt: image.alt }).run();
  }, []);

  /**
   * Shared by drag-drop, clipboard paste, and the toolbar's file picker.
   * Uploads sequentially rather than in parallel so a multi-image drop
   * lands in the order it was dropped instead of whichever finished first.
   */
  const uploadAndInsert = useCallback(
    async (editor: Editor, files: File[]) => {
      const images = files.filter((file) => ALLOWED_IMAGE_TYPES.has(file.type));
      if (images.length === 0) return;

      setUploadError(null);
      setUploading(true);
      try {
        for (const file of images) {
          const uploaded = await uploadImage(file);
          editor
            .chain()
            .focus()
            .setFigureImage({ src: uploaded.url, alt: suggestAltText(uploaded.filename) })
            .run();
        }
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    []
  );

  const slashItems = useMemo<SlashItem[]>(
    () => [
      {
        id: "h2",
        title: "Heading 2",
        hint: "Section heading",
        group: "Text",
        keywords: ["h2", "heading", "title"],
        run: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run(),
      },
      {
        id: "h3",
        title: "Heading 3",
        hint: "Sub-heading",
        group: "Text",
        keywords: ["h3", "heading", "subheading"],
        run: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run(),
      },
      {
        id: "h4",
        title: "Heading 4",
        hint: "Minor heading",
        group: "Text",
        keywords: ["h4", "heading"],
        run: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 4 }).run(),
      },
      {
        id: "bullet",
        title: "Bulleted list",
        hint: "An unordered list",
        group: "Text",
        keywords: ["list", "bullet", "ul"],
        run: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
      },
      {
        id: "ordered",
        title: "Numbered list",
        hint: "A step-by-step list",
        group: "Text",
        keywords: ["list", "ordered", "numbered", "ol"],
        run: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
      },
      {
        id: "quote",
        title: "Pull quote",
        hint: "Set a quote apart",
        group: "Text",
        keywords: ["quote", "blockquote", "pull"],
        run: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
      },
      {
        id: "code",
        title: "Code block",
        hint: "Monospaced block",
        group: "Text",
        keywords: ["code", "pre", "snippet"],
        run: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
      },
      {
        id: "divider",
        title: "Divider",
        hint: "Horizontal rule",
        group: "Text",
        keywords: ["divider", "hr", "rule", "separator"],
        run: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
      },
      ...CALLOUT_TONES.map((tone) => ({
        id: `callout-${tone.value}`,
        title: `${tone.label} callout`,
        hint: "Boxed aside",
        group: "Callouts",
        keywords: ["callout", "box", "alert", tone.value, tone.label.toLowerCase()],
        run: ({ editor, range }: { editor: Editor; range: { from: number; to: number } }) =>
          editor.chain().focus().deleteRange(range).setCallout(tone.value).run(),
      })),
      {
        id: "image",
        title: "Image",
        hint: "Upload or reuse from the library",
        group: "Media",
        keywords: ["image", "photo", "picture", "upload"],
        run: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).run();
          setPickerOpen(true);
        },
      },
      {
        id: "embed",
        title: "Embed",
        hint: "YouTube, X, Vimeo, Spotify, Rumble",
        group: "Media",
        keywords: ["embed", "youtube", "video", "twitter", "x", "spotify", "podcast"],
        run: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).run();
          const url = window.prompt("Paste a YouTube, X, Vimeo, Spotify, SoundCloud, or Rumble URL");
          if (!url) return;
          const embed = toEmbedUrl(url);
          if (!embed) {
            window.alert("That link isn't from a provider this editor can embed. Add it as a normal link instead.");
            return;
          }
          editor.chain().focus().setEmbed(embed.src).run();
        },
      },
      {
        id: "table",
        title: "Table",
        hint: "3×3 with a header row",
        group: "Media",
        keywords: ["table", "grid", "rows", "columns"],
        run: ({ editor, range }) =>
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run(),
      },
    ],
    []
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, autolink: true }),
      FigureImage,
      Callout,
      Embed,
      Table.configure({ resizable: true, HTMLAttributes: { class: "article-table" } }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === "paragraph" ? "Write the story — or press / for blocks…" : "",
      }),
      SlashCommand.configure({ bridge: slashBridge, items: slashItems }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[420px] px-4 py-3 focus:outline-none [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:mt-4 [&_h3]:mb-2",
      },
      // Paste an image straight from the clipboard (screenshots, copied
      // images) — returning true stops ProseMirror from also inserting the
      // clipboard's HTML fallback alongside the upload.
      handlePaste: (view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []);
        const images = files.filter((f) => ALLOWED_IMAGE_TYPES.has(f.type));
        if (images.length > 0 && editorRef.current) {
          event.preventDefault();
          void uploadAndInsert(editorRef.current, images);
          return true;
        }

        // A pasted embeddable URL on its own line becomes an embed rather
        // than a bare link — the behaviour every modern editor has.
        const text = event.clipboardData?.getData("text/plain")?.trim();
        if (text && !text.includes("\n") && editorRef.current) {
          const embed = toEmbedUrl(text);
          if (embed && view.state.selection.empty && view.state.selection.$from.parent.textContent === "") {
            event.preventDefault();
            editorRef.current.chain().focus().setEmbed(embed.src).run();
            return true;
          }
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const files = Array.from((event as DragEvent).dataTransfer?.files ?? []);
        const images = files.filter((f) => ALLOWED_IMAGE_TYPES.has(f.type));
        if (images.length === 0 || !editorRef.current) return false;
        event.preventDefault();
        void uploadAndInsert(editorRef.current, images);
        return true;
      },
    },
  });

  editorRef.current = editor;

  const addLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addEmbed = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Paste a YouTube, X, Vimeo, Spotify, SoundCloud, or Rumble URL");
    if (!url) return;
    const embed = toEmbedUrl(url);
    if (!embed) {
      window.alert("That link isn't from a provider this editor can embed. Add it as a normal link instead.");
      return;
    }
    editor.chain().focus().setEmbed(embed.src).run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="min-h-[464px] animate-pulse rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg-subtle)]" />
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-[var(--admin-border)] bg-white focus-within:border-[var(--admin-primary)] focus-within:ring-2 focus-within:ring-[var(--admin-ring)]">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--admin-border)] bg-[var(--admin-bg-subtle)]/50 p-1.5">
        <ToolbarButton label="Bold (⌘B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Italic (⌘I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Underline (⌘U)"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 4"
          active={editor.isActive("heading", { level: 4 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        >
          <Heading4 className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton label="Bulleted list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Pull quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Callout" active={editor.isActive("callout")} onClick={() => editor.chain().focus().toggleCallout().run()}>
          <AlertTriangle className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton label="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton label="Link (⌘K)" active={editor.isActive("link")} onClick={addLink}>
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Insert image" onClick={() => setPickerOpen(true)}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
        </ToolbarButton>
        <ToolbarButton label="Embed video or post" onClick={addEmbed}>
          <Video className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Insert table"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          <TableIcon className="h-4 w-4" />
        </ToolbarButton>
        {editor.isActive("table") && (
          <>
            <ToolbarButton label="Add column" onClick={() => editor.chain().focus().addColumnAfter().run()}>
              <Columns3 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton label="Delete table" onClick={() => editor.chain().focus().deleteTable().run()}>
              <Minus className="h-4 w-4" />
            </ToolbarButton>
          </>
        )}

        <Divider />

        <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>

        <span className="ml-auto pr-1 text-[11px] text-[var(--admin-fg-muted)]">
          {uploading ? "Uploading image…" : "Type / for blocks · drop or paste images"}
        </span>
      </div>

      {/* Floating toolbar over a text selection — the fast path for
          formatting without reaching for the top bar. */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 120 }}
        shouldShow={({ editor, state }) =>
          // Hide over images/embeds/tables, where a text-formatting menu
          // would be meaningless.
          !state.selection.empty && !editor.isActive("figureImage") && !editor.isActive("embed")
        }
        className="flex items-center gap-0.5 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] p-0.5 shadow-lg"
      >
        <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton label="Link" active={editor.isActive("link")} onClick={addLink}>
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        {editor.isActive("link") && (
          <ToolbarButton label="Remove link" onClick={() => editor.chain().focus().unsetLink().run()}>
            <Unlink className="h-3.5 w-3.5" />
          </ToolbarButton>
        )}
      </BubbleMenu>

      <EditorContent editor={editor} />

      {uploadError && (
        <p className="border-t border-[var(--admin-border)] bg-[var(--admin-danger-bg)] px-4 py-2 text-[12px] text-[var(--admin-danger)]">
          {uploadError}
        </p>
      )}

      <SlashMenu state={slashState} onSelect={(index) => slashState?.select(index)} />

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(image) => insertImage(editor, image)}
      />
    </div>
  );
}

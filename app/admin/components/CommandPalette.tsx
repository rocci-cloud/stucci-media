"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  ArrowRight,
  ExternalLink,
  FileText,
  LogOut,
  Moon,
  PlusCircle,
  Search,
  Sun,
  Upload,
} from "lucide-react";
import { useTheme } from "next-themes";
import { navItemsForRole } from "./nav-items";
import { useSession, authClient } from "../../lib/auth-client";
import { searchArticlesAction, type CommandArticle } from "../search-actions";
import { cn } from "../lib/cn";

/**
 * ⌘K / Ctrl+K command palette — navigation, quick actions, and live
 * article search in one surface. Article results are fetched from the
 * server as you type rather than shipping the whole article list to the
 * client: the catalogue only grows, and this stays the same size.
 */
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [articles, setArticles] = useState<CommandArticle[]>([]);
  const router = useRouter();
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();

  const navItems = useMemo(() => navItemsForRole(session?.user.role), [session?.user.role]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      // Single-key shortcuts, but only when the user isn't typing into
      // something — otherwise "n" would fire mid-headline.
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "n") {
        event.preventDefault();
        router.push("/admin/articles/new");
      } else if (event.key === "/") {
        event.preventDefault();
        setOpen(true);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [router]);

  // Debounced article search. Cleared queries reset immediately so the
  // list never shows results for text that's no longer there.
  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setArticles([]);
      return;
    }
    const timer = setTimeout(async () => {
      const result = await searchArticlesAction(trimmed);
      if (result.success) setArticles(result.articles);
    }, 180);
    return () => clearTimeout(timer);
  }, [query, open]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router]
  );

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      // cmdk does its own filtering by default, which would fight the
      // server-side article search; nav items are filtered manually below.
      shouldFilter={false}
      // cmdk applies `className` to the inner Command element and takes
      // the dialog's own chrome through these two — hand-rolling an
      // overlay inside would sit alongside Radix's real one.
      overlayClassName="fixed inset-0 z-50 bg-black/40"
      contentClassName="fixed top-[15vh] left-1/2 z-50 w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-2xl"
    >
      <div>
        <div className="flex items-center gap-2 border-b border-[var(--admin-border)] px-3">
          <Search className="h-4 w-4 shrink-0 text-[var(--admin-fg-muted)]" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Search articles, jump to a section, run a command…"
            className="h-12 w-full bg-transparent text-[14px] text-[var(--admin-fg)] outline-none placeholder:text-[var(--admin-fg-muted)]"
          />
          <kbd className="hidden shrink-0 rounded border border-[var(--admin-border)] px-1.5 py-0.5 text-[10px] text-[var(--admin-fg-muted)] sm:block">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-[min(420px,60vh)] overflow-y-auto p-2">
          <Command.Empty className="py-8 text-center text-[13px] text-[var(--admin-fg-muted)]">
            Nothing matches “{query}”.
          </Command.Empty>

          {articles.length > 0 && (
            <Command.Group heading="Articles" className={GROUP_CLASS}>
              {articles.map((article) => (
                <Command.Item
                  key={article.id}
                  value={`article-${article.id}`}
                  onSelect={() => go(`/admin/articles/${article.id}/edit`)}
                  className={ITEM_CLASS}
                >
                  <FileText className="h-4 w-4 shrink-0 text-[var(--admin-fg-muted)]" />
                  <span className="min-w-0 flex-1 truncate">{article.headline}</span>
                  <span className="shrink-0 text-[11px] text-[var(--admin-fg-muted)] capitalize">
                    {article.status.replace("_", " ")}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          <Command.Group heading="Actions" className={GROUP_CLASS}>
            <Command.Item value="new-article" onSelect={() => go("/admin/articles/new")} className={ITEM_CLASS}>
              <PlusCircle className="h-4 w-4 shrink-0 text-[var(--admin-fg-muted)]" />
              New article
              <kbd className="ml-auto rounded border border-[var(--admin-border)] px-1.5 py-0.5 text-[10px] text-[var(--admin-fg-muted)]">
                N
              </kbd>
            </Command.Item>
            <Command.Item value="add-podcast" onSelect={() => go("/admin/podcast-feeds")} className={ITEM_CLASS}>
              <PlusCircle className="h-4 w-4 shrink-0 text-[var(--admin-fg-muted)]" />
              Add a podcast
            </Command.Item>
            <Command.Item value="upload-media" onSelect={() => go("/admin/media")} className={ITEM_CLASS}>
              <Upload className="h-4 w-4 shrink-0 text-[var(--admin-fg-muted)]" />
              Upload media
            </Command.Item>
            <Command.Item
              value="toggle-theme"
              onSelect={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className={ITEM_CLASS}
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4 shrink-0 text-[var(--admin-fg-muted)]" />
              ) : (
                <Moon className="h-4 w-4 shrink-0 text-[var(--admin-fg-muted)]" />
              )}
              Switch to {resolvedTheme === "dark" ? "light" : "dark"} mode
            </Command.Item>
            <Command.Item
              value="view-site"
              onSelect={() => {
                setOpen(false);
                window.open("/", "_blank");
              }}
              className={ITEM_CLASS}
            >
              <ExternalLink className="h-4 w-4 shrink-0 text-[var(--admin-fg-muted)]" />
              Open the live site
            </Command.Item>
            <Command.Item
              value="sign-out"
              onSelect={async () => {
                await authClient.signOut();
                window.location.href = "/login";
              }}
              className={ITEM_CLASS}
            >
              <LogOut className="h-4 w-4 shrink-0 text-[var(--admin-fg-muted)]" />
              Sign out
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Go to" className={GROUP_CLASS}>
            {navItems
              .filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()))
              .map((item) => {
                const Icon = item.icon;
                return (
                  <Command.Item
                    key={item.href}
                    value={`nav-${item.href}`}
                    onSelect={() => go(item.href)}
                    className={ITEM_CLASS}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-[var(--admin-fg-muted)]" />
                    {item.label}
                    <ArrowRight className="ml-auto h-3.5 w-3.5 text-[var(--admin-fg-muted)]" />
                  </Command.Item>
                );
              })}
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
}

const GROUP_CLASS =
  "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.06em] [&_[cmdk-group-heading]]:text-[var(--admin-fg-muted)]";

const ITEM_CLASS = cn(
  "flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-[13px] text-[var(--admin-fg)]",
  "data-[selected=true]:bg-[var(--admin-bg-subtle)]"
);

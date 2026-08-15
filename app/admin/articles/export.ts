"use client";

/**
 * Article export. Deliberately a small hand-rolled HTML→Markdown pass
 * rather than a dependency: the input is never arbitrary web HTML, it's
 * exactly the tag set lib/sanitize.ts allows, so the conversion is a
 * closed problem.
 */

type ExportArticle = {
  headline: string;
  dek: string;
  author: string;
  slug: string;
  categories: string[];
  tags: string[];
  publishedAt: string | null;
  coverImageUrl: string | null;
  bodyHtml: string;
};

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function htmlToMarkdown(html: string): string {
  let out = html;

  // Block structures first, so inline replacements below can't corrupt
  // the tags still being matched here.
  out = out.replace(/<figure[^>]*>([\s\S]*?)<\/figure>/gi, (_m, inner: string) => {
    const src = /<img[^>]+src=["']([^"']+)["']/i.exec(inner)?.[1] ?? "";
    const alt = /<img[^>]+alt=["']([^"']*)["']/i.exec(inner)?.[1] ?? "";
    const caption = /<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i.exec(inner)?.[1] ?? "";
    const stripped = caption.replace(/<[^>]+>/g, "").trim();
    return `\n![${alt}](${src})\n${stripped ? `\n*${stripped}*\n` : ""}`;
  });
  out = out.replace(/<div class="embed-wrapper">[\s\S]*?src=["']([^"']+)["'][\s\S]*?<\/div>/gi, "\n[Embedded media]($1)\n");
  out = out.replace(/<img[^>]+src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi, "\n![$2]($1)\n");
  out = out.replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi, "\n![]($1)\n");

  out = out.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n");
  out = out.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n");
  out = out.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n#### $1\n");

  out = out.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, inner: string) =>
    `\n${inner
      .replace(/<[^>]+>/g, "")
      .trim()
      .split("\n")
      .map((line) => `> ${line.trim()}`)
      .join("\n")}\n`
  );

  out = out.replace(/<pre[^>]*>[\s\S]*?<code[^>]*>([\s\S]*?)<\/code>[\s\S]*?<\/pre>/gi, "\n```\n$1\n```\n");
  out = out.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, "\n```\n$1\n```\n");

  // Ordered-list numbering is tracked per list, so a document with several
  // lists doesn't produce one continuously-incrementing sequence.
  out = out.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_m, inner: string) => {
    let n = 0;
    return `\n${inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (__, item: string) => {
      n += 1;
      return `${n}. ${item.replace(/<[^>]+>/g, "").trim()}\n`;
    })}`;
  });
  out = out.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_m, inner: string) =>
    `\n${inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (__, item: string) => `- ${item.replace(/<[^>]+>/g, "").trim()}\n`)}`
  );

  out = out.replace(/<hr\s*\/?>/gi, "\n---\n");
  out = out.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n$1\n");
  out = out.replace(/<br\s*\/?>/gi, "  \n");

  // Inline marks.
  out = out.replace(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)");
  out = out.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**");
  out = out.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, "*$2*");
  out = out.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`");

  // Anything left (tables, callout wrappers) degrades to its text.
  out = out.replace(/<[^>]+>/g, "");

  return decodeEntities(out)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function toMarkdown(article: ExportArticle): string {
  const frontmatter = [
    "---",
    `title: ${JSON.stringify(article.headline)}`,
    `slug: ${JSON.stringify(article.slug)}`,
    `description: ${JSON.stringify(article.dek)}`,
    `author: ${JSON.stringify(article.author)}`,
    `categories: [${article.categories.map((c) => JSON.stringify(c)).join(", ")}]`,
    `tags: [${article.tags.map((t) => JSON.stringify(t)).join(", ")}]`,
    ...(article.publishedAt ? [`date: ${article.publishedAt}`] : []),
    ...(article.coverImageUrl ? [`image: ${JSON.stringify(article.coverImageUrl)}`] : []),
    "---",
    "",
  ].join("\n");

  return `${frontmatter}# ${article.headline}\n\n${article.dek}\n\n${htmlToMarkdown(article.bodyHtml)}\n`;
}

export function toStandaloneHtml(article: ExportArticle): string {
  const escape = (text: string) =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(article.headline)}</title>
<meta name="description" content="${escape(article.dek)}">
</head>
<body>
<article>
<h1>${escape(article.headline)}</h1>
<p><em>${escape(article.dek)}</em></p>
<p>By ${escape(article.author)}${article.publishedAt ? ` — ${escape(article.publishedAt)}` : ""}</p>
${article.coverImageUrl ? `<img src="${escape(article.coverImageUrl)}" alt="">` : ""}
${article.bodyHtml}
</article>
</body>
</html>
`;
}

export function downloadFile(filename: string, contents: string, mimeType: string): void {
  const blob = new Blob([contents], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoking immediately can cancel the download in some browsers; one
  // tick later is enough for the click to have been handled.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function SiteFooter() {
  return (
    <footer className="font-sans mx-auto max-w-[1200px] px-5 py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--color-gray-light)]">
      <div>© 2026 Stucci Media — All Rights Reserved</div>
      <div className="flex gap-4">
        <a href="/about" className="hover:text-[var(--color-text)]">
          About
        </a>
        <a href="/contact" className="hover:text-[var(--color-text)]">
          Contact
        </a>
        <a href="/privacy" className="hover:text-[var(--color-text)]">
          Privacy
        </a>
      </div>
    </footer>
  );
}

import Link from "next/link";
import SidebarNav from "./SidebarNav";

export default function AdminSidebar() {
  return (
    <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-[var(--admin-sidebar-border)] lg:bg-[var(--admin-sidebar-bg)]">
      <div className="flex h-14 items-center gap-2 px-5">
        <Link href="/admin" className="font-headline text-[19px] font-bold uppercase tracking-tight text-white">
          Stucci<span className="text-[var(--admin-primary)]">Media</span>
        </Link>
      </div>
      <div className="px-5 pb-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/35">Admin</span>
      </div>
      <div className="flex-1 overflow-y-auto pb-4">
        <SidebarNav />
      </div>
      <div className="border-t border-[var(--admin-sidebar-border)] px-5 py-4">
        <Link href="/" className="text-[12px] font-medium text-white/45 hover:text-white/80 transition-colors">
          ← Back to site
        </Link>
      </div>
    </aside>
  );
}

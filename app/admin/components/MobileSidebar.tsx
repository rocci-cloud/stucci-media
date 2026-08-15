"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Button } from "./ui/button";
import SidebarNav from "./SidebarNav";

export default function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetTitle>Admin navigation</SheetTitle>
        <div className="flex h-14 items-center gap-2 px-5">
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="font-headline text-[19px] font-bold uppercase tracking-tight text-white"
          >
            Stucci<span className="text-[var(--admin-primary)]">Media</span>
          </Link>
        </div>
        <div className="px-5 pb-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/35">Admin</span>
        </div>
        <div className="flex-1 overflow-y-auto pb-4">
          <SidebarNav onNavigate={() => setOpen(false)} />
        </div>
        <div className="border-t border-[var(--admin-sidebar-border)] px-5 py-4">
          {/* Plain <a> for the same reason as AdminSidebar's. */}
          <a href="/" className="text-[12px] font-medium text-white/45 hover:text-white/80 transition-colors">
            ← Back to site
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}

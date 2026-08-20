"use client";

import { ThemeProvider } from "next-themes";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import CommandPalette from "./CommandPalette";
import { Toaster } from "./ui/sonner";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    // Dark mode is scoped to the admin only — the public site is
    // deliberately light-only (see the `color-scheme: light only`
    // overrides in globals.css), so the theme class is attached here
    // rather than to <html> in the root layout. `defaultTheme: system`
    // means the dashboard follows the OS unless someone picks a side.
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="stucci-admin-theme">
      <div className="admin-root flex min-h-screen bg-[var(--admin-bg)] font-sans">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar />
          <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
        <CommandPalette />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

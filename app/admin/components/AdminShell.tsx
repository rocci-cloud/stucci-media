import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import { Toaster } from "./ui/sonner";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--admin-bg)] font-sans">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}

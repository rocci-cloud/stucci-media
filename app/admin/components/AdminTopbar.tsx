"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut, User as UserIcon } from "lucide-react";
import { ADMIN_NAV_ITEMS } from "./nav-items";
import MobileSidebar from "./MobileSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { authClient, useSession } from "../../lib/auth-client";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AdminTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const current =
    [...ADMIN_NAV_ITEMS].reverse().find((item) =>
      item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
    ) ?? ADMIN_NAV_ITEMS[0];

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  const user = session?.user;

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-surface)]/95 px-4 backdrop-blur sm:px-6">
      <MobileSidebar />
      <h1 className="text-[15px] font-semibold text-[var(--admin-fg)]">{current.label}</h1>

      <div className="ml-auto flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-ring)]">
            <Avatar>
              {user?.image && <AvatarImage src={user.image} alt={user.name} />}
              <AvatarFallback>{user?.name ? initials(user.name) : <UserIcon className="h-4 w-4" />}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-[var(--admin-fg)]">{user?.name ?? "—"}</span>
              <span className="text-xs font-normal text-[var(--admin-fg-muted)]">{user?.email ?? ""}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleSignOut} variant="destructive">
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

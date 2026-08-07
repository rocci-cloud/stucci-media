"use client";

import { useRouter } from "next/navigation";
import { authClient } from "../lib/auth-client";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="text-sm font-bold uppercase text-[var(--color-gray)] hover:text-[var(--color-text)]"
    >
      Log out
    </button>
  );
}

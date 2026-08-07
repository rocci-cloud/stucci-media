import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../lib/auth";
import AdminShell from "./components/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login?from=/admin");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return <AdminShell>{children}</AdminShell>;
}

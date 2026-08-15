"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { authClient, useSession } from "../../lib/auth-client";
import { ROLE_LABELS, type AppRole } from "../../lib/permissions";

export default function SettingsClient() {
  const { data: session, isPending: sessionLoading } = useSession();
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (session?.user.name) setName(session.user.name);
  }, [session?.user.name]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setPending(true);
    const { error } = await authClient.updateUser({ name: name.trim() });
    setPending(false);
    if (error) {
      toast.error(error.message ?? "Couldn't save your name.");
      return;
    }
    toast.success("Profile updated.");
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account details for the admin dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          {sessionLoading ? (
            <div className="flex items-center gap-2 py-4 text-[13px] text-[var(--admin-fg-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="settings-name">Name</Label>
                <Input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="settings-email">Email</Label>
                <Input id="settings-email" value={session?.user.email ?? ""} disabled />
              </div>

              <div className="flex items-center gap-2">
                <Label className="mb-0">Role</Label>
                <Badge variant="primary">{ROLE_LABELS[session?.user.role as AppRole] ?? session?.user.role ?? "—"}</Badge>
              </div>

              <Separator />

              <Button type="submit" disabled={pending || name.trim() === session?.user.name} className="self-start">
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, Loader2, Mail, ShieldOff, ShieldCheck, UserPlus, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { inviteStaffAction, revokeInviteAction, setUserBannedAction, setUserRoleAction } from "./actions";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, STAFF_ROLES, type AppRole } from "../../lib/permissions";
import type { StaffInvite, StaffUser } from "../../lib/users";

export default function UsersClient({
  users: initialUsers,
  invites: initialInvites,
  currentUserId,
  registerUrl,
  readerCount,
}: {
  users: StaffUser[];
  invites: StaffInvite[];
  currentUserId: string;
  registerUrl: string;
  readerCount: number;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [invites, setInvites] = useState(initialInvites);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("AUTHOR");
  const [inviting, setInviting] = useState(false);
  const [, startTransition] = useTransition();

  async function invite() {
    setInviting(true);
    const result = await inviteStaffAction(email, role);
    setInviting(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setInvites((prev) => [result.invite, ...prev.filter((i) => i.email !== result.invite.email)]);
    setEmail("");
    setInviteOpen(false);
    toast.success("Invite created — copy the link and send it to them.");
  }

  function changeRole(user: StaffUser, next: AppRole) {
    const previous = users;
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: next } : u)));
    startTransition(async () => {
      const result = await setUserRoleAction(user.id, next);
      if (!result.success) {
        setUsers(previous);
        toast.error(result.error);
        return;
      }
      // Dropping someone to reader removes them from this list entirely —
      // it only shows staff.
      if (next === "USER") setUsers((prev) => prev.filter((u) => u.id !== user.id));
      toast.success(`${user.name} is now ${ROLE_LABELS[next]}.`);
    });
  }

  function toggleBanned(user: StaffUser) {
    const next = !user.banned;
    const previous = users;
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, banned: next } : u)));
    startTransition(async () => {
      const result = await setUserBannedAction(user.id, next);
      if (!result.success) {
        setUsers(previous);
        toast.error(result.error);
        return;
      }
      toast.success(next ? `${user.name} suspended.` : `${user.name} reinstated.`);
    });
  }

  function revoke(invite: StaffInvite) {
    const previous = invites;
    setInvites((prev) => prev.filter((i) => i.id !== invite.id));
    startTransition(async () => {
      const result = await revokeInviteAction(invite.id, invite.email);
      if (!result.success) {
        setInvites(previous);
        toast.error(result.error);
      }
    });
  }

  function copyInviteLink(invite: StaffInvite) {
    void navigator.clipboard.writeText(`${registerUrl}?invite=${invite.token}`);
    toast.success("Invite link copied.");
  }

  const pendingInvites = invites.filter((i) => !i.acceptedAt);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--admin-fg)]">Users &amp; Roles</h1>
          <p className="text-[13px] text-[var(--admin-fg-muted)]">
            {users.length} staff · {readerCount.toLocaleString()} reader{readerCount === 1 ? "" : "s"}
          </p>
        </div>
        <Button size="sm" onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Invite
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell text-right">Articles</TableHead>
                <TableHead className="w-40">Role</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className={user.banned ? "opacity-60" : ""}>
                  <TableCell className="font-medium">
                    {user.name}
                    {user.id === currentUserId && (
                      <Badge variant="outline" className="ml-2">
                        You
                      </Badge>
                    )}
                    {user.banned && (
                      <Badge variant="danger" className="ml-2">
                        Suspended
                      </Badge>
                    )}
                    <span className="block truncate text-[11.5px] text-[var(--admin-fg-muted)] sm:hidden">
                      {user.email}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-[13px] text-[var(--admin-fg-muted)] sm:table-cell">
                    {user.email}
                  </TableCell>
                  <TableCell className="hidden text-right text-[13px] text-[var(--admin-fg-muted)] tabular-nums md:table-cell">
                    {user.articleCount}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(v) => changeRole(user, v as AppRole)}
                      disabled={user.id === currentUserId}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STAFF_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </SelectItem>
                        ))}
                        <SelectItem value="USER">{ROLE_LABELS.USER}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {user.id !== currentUserId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={user.banned ? `Reinstate ${user.name}` : `Suspend ${user.name}`}
                        title={user.banned ? "Reinstate" : "Suspend"}
                        onClick={() => toggleBanned(user)}
                      >
                        {user.banned ? (
                          <ShieldCheck className="h-4 w-4 text-[var(--admin-success)]" />
                        ) : (
                          <ShieldOff className="h-4 w-4 text-[var(--admin-fg-muted)]" />
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending invites</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingInvites.length === 0 ? (
            <p className="py-4 text-[13px] text-[var(--admin-fg-muted)]">
              No pending invites. Inviting someone creates a link you send them — they register normally and land in
              the role you picked.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--admin-border)]">
              {pendingInvites.map((invite) => (
                <li key={invite.id} className="flex flex-wrap items-center gap-2 py-2.5">
                  <Mail className="h-4 w-4 shrink-0 text-[var(--admin-fg-muted)]" />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--admin-fg)]">{invite.email}</span>
                  <Badge variant="outline">{ROLE_LABELS[invite.role]}</Badge>
                  {invite.isExpired ? (
                    <Badge variant="danger">Expired</Badge>
                  ) : (
                    <span className="text-[11.5px] text-[var(--admin-fg-muted)]">
                      expires {new Date(invite.expiresAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                    </span>
                  )}
                  <Button size="sm" variant="outline" onClick={() => copyInviteLink(invite)}>
                    <Copy className="h-3.5 w-3.5" />
                    Copy link
                  </Button>
                  <Button size="sm" variant="ghost" aria-label="Revoke invite" onClick={() => revoke(invite)}>
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What each role can do</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2.5">
            {[...STAFF_ROLES, "USER" as const].map((r) => (
              <div key={r} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                <dt className="w-20 shrink-0 text-[13px] font-semibold text-[var(--admin-fg)]">{ROLE_LABELS[r]}</dt>
                <dd className="text-[13px] text-[var(--admin-fg-muted)]">{ROLE_DESCRIPTIONS[r]}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite someone</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="reporter@example.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAFF_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11.5px] text-[var(--admin-fg-muted)]">{ROLE_DESCRIPTIONS[role]}</p>
            </div>
            <p className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg-subtle)] px-3 py-2.5 text-[12px] text-[var(--admin-fg-muted)]">
              No email is sent — this site has no mail provider connected. You get a link to pass along however you
              like; they register with it and land in this role automatically.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={invite} disabled={inviting || !email.trim()}>
              {inviting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

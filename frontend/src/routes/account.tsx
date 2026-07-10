import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useLogout, useChangePassword, useDeleteAccount } from "@/api/auth";
import { Button, Input, Card, Badge } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/account")({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({
        to: "/auth/login",
        search: { redirect: "/account" },
      });
    }
  },
  component: AccountPage,
});

function Section({
  title,
  description,
  danger,
  children,
}: {
  title: string;
  description: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        className={cn(
          "text-[0.8125rem] font-semibold uppercase tracking-wider",
          danger ? "text-destructive" : "text-foreground"
        )}
      >
        {title}
      </h2>
      <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function AccountPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useToast();
  const logoutMutation = useLogout();
  const changePasswordMutation = useChangePassword();
  const deleteAccountMutation = useDeleteAccount();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate({ to: "/auth/login" });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast("Passwords do not match", "error");
      return;
    }
    try {
      await changePasswordMutation.mutateAsync({
        current_password: currentPassword,
        new_password: newPassword,
      });
      addToast("Password changed successfully", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Failed to change password",
        "error"
      );
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccountMutation.mutateAsync();
      addToast("Account deleted successfully", "success");
      navigate({ to: "/auth/login" });
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Failed to delete account",
        "error"
      );
    }
  };

  const initials = user.username.slice(0, 2).toUpperCase();
  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-3xl space-y-10"
    >
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Account
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, password, and account.
        </p>
      </header>

      {/* Identity */}
      <Card className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-md bg-elevated font-mono text-xl font-semibold text-foreground">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-display text-lg font-semibold tracking-tight text-foreground">
              {user.username}
            </h2>
            {user.is_admin && <Badge variant="warning">Admin</Badge>}
            <Badge variant={user.is_active ? "success" : "error"}>
              {user.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 sm:text-right">
          <div>
            <div className="text-xs uppercase tracking-wider text-faint">Member since</div>
            <div className="font-mono text-sm tabular-nums text-foreground">{memberSince}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-faint">Reputation</div>
            <div className="font-mono text-sm tabular-nums text-foreground">
              {user.reputation_score}
            </div>
          </div>
        </div>
      </Card>

      {/* Password */}
      <Section title="Password" description="Change the password used to sign in.">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Input
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
            <Input
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={
                !currentPassword ||
                !newPassword ||
                !confirmPassword ||
                changePasswordMutation.isPending
              }
              isLoading={changePasswordMutation.isPending}
            >
              Update password
            </Button>
          </div>
        </form>
      </Section>

      {/* Session */}
      <Section title="Session" description="Sign out of your account on this device.">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Signed in as{" "}
            <span className="font-medium text-foreground">{user.username}</span>.
          </p>
          <Button
            variant="secondary"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            isLoading={logoutMutation.isPending}
          >
            <LogOut className="size-4" />
            Log out
          </Button>
        </div>
      </Section>

      {/* Danger zone */}
      <Section
        title="Danger zone"
        description="Permanently delete your account and all associated data."
        danger
      >
        {!showDeleteConfirm ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm text-muted-foreground">
              This action cannot be undone.
            </p>
            <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
              Delete account
            </Button>
          </div>
        ) : (
          <div className="space-y-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">
              Are you sure you want to delete your account? This cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                disabled={deleteAccountMutation.isPending}
                isLoading={deleteAccountMutation.isPending}
              >
                Yes, delete my account
              </Button>
            </div>
          </div>
        )}
      </Section>
    </motion.div>
  );
}

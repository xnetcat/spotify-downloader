import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { CircleAlert } from "lucide-react";
import { useLogin } from "@/api";
import { Button, Input, Card } from "@/components/ui";

interface LoginSearch {
  redirect?: string;
}

export const Route = createFileRoute("/auth/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: LoginPage,
});

function Wordmark() {
  return (
    <div className="text-center">
      <span className="font-display text-3xl font-bold tracking-tight">
        <span className="text-foreground">spot</span>
        <span className="text-primary">DL</span>
      </span>
    </div>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const loginMutation = useLogin();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginMutation.mutateAsync({ username, password });
      navigate({ to: redirect || "/" });
    } catch {
      // Error surfaced via loginMutation.error
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm space-y-6"
      >
        <Wordmark />

        <div className="text-center">
          <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to continue.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />

            {loginMutation.error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <CircleAlert className="size-4 shrink-0" />
                <p>
                  {loginMutation.error instanceof Error
                    ? loginMutation.error.message
                    : "Login failed. Please try again."}
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" isLoading={loginMutation.isPending}>
              Sign in
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/auth/register"
            className="font-medium text-info underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>

        <p className="text-center font-mono text-xs text-faint">
          spotDL · your music, downloaded
        </p>
      </motion.div>
    </div>
  );
}

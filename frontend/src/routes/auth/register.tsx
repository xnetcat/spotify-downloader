import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { CircleAlert, ShieldCheck } from "lucide-react";
import { useRegister, useSystemStats } from "@/api";
import { Button, Input, Card } from "@/components/ui";
import { features } from "@/config";

export const Route = createFileRoute("/auth/register")({
  component: RegisterPage,
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

function RegisterPage() {
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: stats } = useSystemStats();
  const isFirstUser = features.isSelfHosted && stats?.entities.users === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      await registerMutation.mutateAsync({ username, email, password });
      navigate({ to: "/" });
    } catch {
      // Error surfaced via registerMutation.error
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
            Create account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Join to contribute and vote on matches.
          </p>
        </div>

        {isFirstUser && (
          <div className="flex items-start gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            <p>The first user on a self-hosted instance becomes an administrator.</p>
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              required
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password (min. 8 characters)"
              required
            />
            <Input
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
            />

            {(error || registerMutation.error) && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <CircleAlert className="size-4 shrink-0" />
                <p>
                  {error ||
                    (registerMutation.error instanceof Error
                      ? registerMutation.error.message
                      : "Registration failed. Please try again.")}
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={registerMutation.isPending}
            >
              Create account
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/auth/login"
            className="font-medium text-info underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>

        <p className="text-center font-mono text-xs text-faint">
          spotDL · your music, downloaded
        </p>
      </motion.div>
    </div>
  );
}

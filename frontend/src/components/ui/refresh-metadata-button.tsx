import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Check, Clock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { useAuthStore } from "@/stores/auth";

const DEFAULT_COOLDOWN_SECONDS = 4 * 60 * 60;

interface RefreshMetadataButtonProps {
  /** Unique entity ID for tracking cooldown per entity */
  entityId: string;
  /** Function to refresh metadata from source platform */
  onRefresh: () => Promise<void>;
  /** Optional function to enrich from external sources (MusicBrainz, etc.) */
  onEnrich?: () => Promise<void>;
  className?: string;
  variant?: "default" | "ghost" | "outline" | "icon";
  size?: "sm" | "md" | "lg";
}

/**
 * Get cooldown key for localStorage
 */
function getCooldownKey(entityId: string): string {
  return `spotdl_refresh_cooldown_${entityId}`;
}

/**
 * Get the remaining cooldown end timestamp from localStorage
 */
function getCooldownEnd(entityId: string): number {
  const key = getCooldownKey(entityId);
  const cooldownEnd = localStorage.getItem(key);
  if (!cooldownEnd) return 0;

  const endTime = parseInt(cooldownEnd, 10);
  if (isNaN(endTime)) return 0;

  return endTime;
}

/**
 * Get remaining cooldown time in milliseconds
 */
function getRemainingCooldown(entityId: string): number {
  const endTime = getCooldownEnd(entityId);
  if (!endTime) return 0;

  const remaining = endTime - Date.now();
  return remaining > 0 ? remaining : 0;
}

/**
 * Format remaining time as human-readable string
 */
function formatRemainingTime(ms: number): string {
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return "< 1m";
}

/**
 * Record cooldown based on server response (seconds until retry)
 */
function recordCooldown(entityId: string, retryAfterSeconds: number): void {
  const key = getCooldownKey(entityId);
  const cooldownEnd = Date.now() + retryAfterSeconds * 1000;
  localStorage.setItem(key, cooldownEnd.toString());
}

/**
 * Check if error is a 429 rate limit error
 */
function isCooldownError(error: unknown): error is { response?: { status: number; headers?: Headers }; status?: number } {
  if (error && typeof error === "object") {
    const enriched = error as {
      response?: { status?: number };
      status?: number;
      cause?: { response?: { status?: number }; status?: number };
    };

    if (enriched.status === 429 || enriched.cause?.status === 429) {
      return true;
    }

    // Axios-style error
    if ("response" in error && (error as { response?: { status?: number } }).response?.status === 429) {
      return true;
    }

    if (enriched.cause?.response?.status === 429) {
      return true;
    }

    // Fetch-style error
    if ("status" in error && (error as { status?: number }).status === 429) {
      return true;
    }
  }
  return false;
}

/**
 * Extract retry-after seconds from error
 */
function getRetryAfterSeconds(error: unknown): number {
  // Default to 4 hours if we can't parse
  const defaultSeconds = DEFAULT_COOLDOWN_SECONDS;

  try {
    if (error && typeof error === "object") {
      const enriched = error as {
        response?: { data?: { detail?: string }; headers?: Record<string, string | number | undefined> };
        cause?: { response?: { data?: { detail?: string }; headers?: Record<string, string | number | undefined> } };
      };
      const response = enriched.response ?? enriched.cause?.response;
      const retryAfterRaw =
        response?.headers?.["retry-after"] ?? response?.headers?.["Retry-After"];
      const retryAfter = Number(retryAfterRaw);
      if (!Number.isNaN(retryAfter) && retryAfter > 0) {
        return Math.floor(retryAfter);
      }

      // Try to get from error message (e.g., "Try again in 3h 45m")
      const detail = response?.data?.detail;
      if (detail && typeof detail === "string") {
        // Parse "Try again in Xh Ym" format
        const match = detail.match(/(\d+)h\s*(\d+)m/);
        if (match) {
          const hours = parseInt(match[1], 10);
          const minutes = parseInt(match[2], 10);
          return hours * 3600 + minutes * 60;
        }
      }
    }
  } catch {
    // Ignore parse errors
  }

  return defaultSeconds;
}

/**
 * Button to refresh and enrich metadata for an entity.
 * Includes cooldown protection (4 hours) for regular users.
 * Admins bypass cooldown.
 */
export function RefreshMetadataButton({
  entityId,
  onRefresh,
  onEnrich,
  className,
  variant = "ghost",
  size = "sm",
}: RefreshMetadataButtonProps) {
  const { user } = useAuthStore();
  const isAdmin = user?.is_admin ?? false;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<"success" | "error" | "cooldown" | null>(null);
  const [remainingCooldown, setRemainingCooldown] = useState(0);

  // Update cooldown timer
  const updateCooldown = useCallback(() => {
    if (isAdmin) {
      setRemainingCooldown(0);
      return;
    }
    setRemainingCooldown(getRemainingCooldown(entityId));
  }, [entityId, isAdmin]);

  // Check cooldown on mount and periodically
  useEffect(() => {
    updateCooldown();

    // Update every minute if on cooldown
    const interval = setInterval(updateCooldown, 60 * 1000);
    return () => clearInterval(interval);
  }, [updateCooldown]);

  const isOnCooldown = remainingCooldown > 0 && !isAdmin;
  const isLoading = isRefreshing;
  const isDisabled = isLoading || isOnCooldown;

  const handleClick = async () => {
    if (isDisabled) return;

    setIsRefreshing(true);
    setFeedback(null);

    try {
      // Refresh from source platform
      await onRefresh();

      // Enrich from external sources if available
      if (onEnrich) {
        await onEnrich();
      }

      // Server enforces a 4h cooldown for non-admin users; mirror that locally.
      if (!isAdmin) {
        recordCooldown(entityId, DEFAULT_COOLDOWN_SECONDS);
        updateCooldown();
      }

      setFeedback("success");
      setTimeout(() => setFeedback(null), 2000);
    } catch (error) {
      // Handle 429 cooldown error from server
      if (isCooldownError(error)) {
        const retryAfter = getRetryAfterSeconds(error);
        recordCooldown(entityId, retryAfter);
        updateCooldown();
        setFeedback("cooldown");
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback("error");
        setTimeout(() => setFeedback(null), 3000);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Icon-only variant
  if (variant === "icon") {
    const IconCmp =
      feedback === "success"
        ? Check
        : feedback === "error"
          ? AlertTriangle
          : feedback === "cooldown"
            ? Clock
            : RefreshCw;
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        aria-label="Refresh metadata"
        title={
          isOnCooldown
            ? `Refresh available in ${formatRemainingTime(remainingCooldown)}`
            : feedback === "cooldown"
              ? "On cooldown"
              : "Refresh metadata"
        }
        className={cn(
          "relative rounded-md p-2 transition-colors",
          "text-muted-foreground hover:bg-accent hover:text-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
          feedback === "success" && "text-success",
          feedback === "error" && "text-destructive",
          feedback === "cooldown" && "text-warning",
          className
        )}
      >
        <IconCmp className={cn("size-4", isLoading && "animate-spin")} />
      </button>
    );
  }

  // Button text based on state
  const getButtonText = () => {
    if (isLoading) return "Refreshing…";
    if (feedback === "success") return "Refreshed";
    if (feedback === "error") return "Failed";
    if (feedback === "cooldown") return "On cooldown";
    if (isOnCooldown) return `Wait ${formatRemainingTime(remainingCooldown)}`;
    return "Refresh";
  };

  // Map variant to Button variant
  const buttonVariant = variant === "default" ? "primary" : variant;

  return (
    <Button
      variant={buttonVariant}
      size={size}
      onClick={handleClick}
      disabled={isDisabled}
      title={
        isOnCooldown
          ? `Refresh available in ${formatRemainingTime(remainingCooldown)}`
          : feedback === "cooldown"
            ? "This entity was recently refreshed"
            : undefined
      }
      className={cn(
        feedback === "success" && "!text-success",
        feedback === "error" && "!text-destructive",
        feedback === "cooldown" && "!text-warning",
        isOnCooldown && "opacity-70",
        className
      )}
    >
      <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
      {getButtonText()}
    </Button>
  );
}

export default RefreshMetadataButton;

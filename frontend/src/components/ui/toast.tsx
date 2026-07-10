import { type ReactNode } from "react";
import type { Toast, ToastVariant } from "@/types";
import { toast as sonnerToast } from "./sonner";

/**
 * Compatibility shim. The Control Room design drives all feedback through
 * sonner (see `./sonner` + the root-mounted <Toaster/>). This preserves the
 * old `ToastProvider` / `useToast` API so existing call sites keep working —
 * every method delegates to sonner.
 */

function emit(message: string, variant: ToastVariant = "info", duration?: number): string {
  const opts = duration != null ? { duration } : undefined;
  const fn =
    variant === "success"
      ? sonnerToast.success
      : variant === "error"
        ? sonnerToast.error
        : variant === "warning"
          ? sonnerToast.warning
          : sonnerToast.info;
  return String(fn(message, opts));
}

export function useToast() {
  return {
    /** Sonner owns the toast list; kept for API compatibility. */
    toasts: [] as Toast[],
    addToast: (message: string, variant: ToastVariant = "info", duration?: number) =>
      emit(message, variant, duration),
    removeToast: (id: string) => sonnerToast.dismiss(id),
    success: (message: string, duration?: number) => emit(message, "success", duration),
    error: (message: string, duration?: number) => emit(message, "error", duration),
    warning: (message: string, duration?: number) => emit(message, "warning", duration),
    info: (message: string, duration?: number) => emit(message, "info", duration),
  };
}

/** Passthrough — the actual <Toaster/> is mounted once at the app root. */
export function ToastProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export default ToastProvider;

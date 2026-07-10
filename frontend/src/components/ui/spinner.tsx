import { type HTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const spinnerSizes = { sm: "size-4", md: "size-8", lg: "size-12" };

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = "md", ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      aria-label="Loading"
      className={cn("inline-flex text-primary", className)}
      {...props}
    >
      <Loader2 className={cn("animate-spin", spinnerSizes[size])} />
    </div>
  )
);
Spinner.displayName = "Spinner";

/**
 * Segmented meter-pulse loader — the Control Room signature, mirrored from the
 * TUI's ▰▱ motif. A row of cells that pulse opacity in a staggered sweep.
 */
export const WaveformLoader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { bars?: number }
>(({ className, bars = 5, style, ...props }, ref) => (
  <div
    ref={ref}
    role="status"
    aria-label="Loading"
    className={cn("meter h-4 w-16", className)}
    style={{ ...style, ["--meter-cells" as string]: bars }}
    {...props}
  >
    {Array.from({ length: bars }, (_, i) => (
      <span
        key={i}
        className="meter-cell"
        data-active="true"
        style={{ animationDelay: `${i * 0.12}s` }}
      />
    ))}
  </div>
));
WaveformLoader.displayName = "WaveformLoader";

export const EqualizerLoader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, style, ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      aria-label="Loading"
      className={cn("meter h-5 w-14", className)}
      style={{ ...style, ["--meter-cells" as string]: 5 }}
      {...props}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className="meter-cell"
          data-active="true"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
);
EqualizerLoader.displayName = "EqualizerLoader";

export interface LoadingProps extends HTMLAttributes<HTMLDivElement> {
  text?: string;
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "waveform" | "equalizer";
}

export const Loading = forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, text = "Loading…", size = "md", variant = "waveform", ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col items-center justify-center gap-4", className)}
      {...props}
    >
      {variant === "spinner" && <Spinner size={size} />}
      {variant === "waveform" && <WaveformLoader />}
      {variant === "equalizer" && <EqualizerLoader />}
      {text && <p className="text-sm font-medium text-muted-foreground">{text}</p>}
    </div>
  )
);
Loading.displayName = "Loading";

// Skeleton is the shared primitive; re-exported here for legacy import paths.
export { Skeleton, type SkeletonProps } from "./skeleton";

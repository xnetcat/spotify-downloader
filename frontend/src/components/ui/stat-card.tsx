import { type ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  /** Main value to display */
  value: string | number;
  /** Label describing the value */
  label: string;
  /** Optional trend indicator */
  trend?: {
    value: number;
    label?: string;
  };
  /** Icon to display */
  icon?: ReactNode;
  /** Color accent variant */
  variant?: "default" | "success" | "warning" | "error" | "info";
  /** Additional class names */
  className?: string;
}

const variantValueColor: Record<NonNullable<StatCardProps["variant"]>, string> = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  error: "text-destructive",
  info: "text-info",
};

const variantIconColor: Record<NonNullable<StatCardProps["variant"]>, string> = {
  default: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  error: "text-destructive",
  info: "text-info",
};

export function StatCard({
  value,
  label,
  trend,
  icon,
  variant = "default",
  className,
}: StatCardProps) {
  const isPositive = trend ? trend.value >= 0 : null;

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-5 transition-colors duration-150 hover:border-faint/50",
        className
      )}
    >
      {icon && (
        <div className={cn("mb-4 [&_svg]:size-5", variantIconColor[variant])}>{icon}</div>
      )}

      <div className="text-xs font-medium uppercase tracking-wider text-faint">{label}</div>

      <div
        className={cn(
          "mt-1 font-display text-3xl font-bold tracking-tight tnum",
          variantValueColor[variant]
        )}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>

      {trend && (
        <div
          className={cn(
            "mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs font-medium tnum",
            isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}
        >
          {isPositive ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
          <span>
            {isPositive ? "+" : ""}
            {trend.value}%
          </span>
          {trend.label && <span className="text-faint">{trend.label}</span>}
        </div>
      )}
    </div>
  );
}

export interface StatCardGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatCardGrid({ children, columns = 4, className }: StatCardGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return <div className={cn("grid gap-4", gridCols[columns], className)}>{children}</div>;
}

export interface StatInlineProps {
  value: string | number;
  label: string;
  icon?: ReactNode;
  className?: string;
}

export function StatInline({ value, label, icon, className }: StatInlineProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {icon && <div className="text-muted-foreground [&_svg]:size-4">{icon}</div>}
      <span className="font-mono font-semibold tnum text-foreground">
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

export default StatCard;

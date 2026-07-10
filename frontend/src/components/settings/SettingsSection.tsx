import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A settings section: an eyebrow heading + one-line description, followed by a
 * hairline-divided stack of control rows. Flat — no nested cards.
 */
export function SettingsSection({
  id,
  title,
  description,
  danger,
  children,
}: {
  id: string;
  title: string;
  description: string;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <header>
        <h2
          className={cn(
            "text-[0.8125rem] font-semibold uppercase tracking-wider",
            danger ? "text-destructive" : "text-foreground"
          )}
        >
          {title}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      </header>
      <div className="mt-4 divide-y divide-border border-t border-border">{children}</div>
    </section>
  );
}

/**
 * A control row: label + help text on the left, control on the right. Stacks on
 * narrow screens. `danger` tints the label destructive.
 */
export function SettingRow({
  label,
  help,
  htmlFor,
  danger,
  children,
}: {
  label: string;
  help?: ReactNode;
  htmlFor?: string;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0 sm:max-w-md">
        <label
          htmlFor={htmlFor}
          className={cn(
            "block text-sm font-medium",
            danger ? "text-destructive" : "text-foreground"
          )}
        >
          {label}
        </label>
        {help && <div className="mt-1 text-xs text-muted-foreground">{help}</div>}
      </div>
      <div className="shrink-0 sm:min-w-[220px] sm:text-right">{children}</div>
    </div>
  );
}

/**
 * A full-width row for controls that own their layout (sliders, provider lists).
 * Keeps the hairline divider rhythm without the label/control split.
 */
export function SettingBlock({ children }: { children: ReactNode }) {
  return <div className="py-5">{children}</div>;
}

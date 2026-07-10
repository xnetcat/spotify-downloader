import { Toaster as SonnerToaster, toast } from "sonner";
import { type ComponentProps } from "react";

export type ToasterProps = ComponentProps<typeof SonnerToaster>;

/**
 * App toaster. Mounted once at the root. Themed to Control Room tokens via
 * sonner's CSS variables so it tracks light/dark automatically; richColors is
 * left off so success/error read in our palette, not sonner's.
 */
export function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      position="bottom-right"
      richColors={false}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!bg-popover !border !border-border !text-popover-foreground !rounded-lg !shadow-lg !font-sans",
          title: "!text-sm !font-medium !text-foreground",
          description: "!text-sm !text-muted-foreground",
          actionButton: "!bg-primary !text-primary-foreground !rounded-md !text-xs",
          cancelButton: "!bg-elevated !text-muted-foreground !rounded-md !text-xs",
          closeButton: "!bg-surface !border-border !text-muted-foreground",
          icon: "!text-muted-foreground",
          error: "!text-destructive [&_[data-icon]]:!text-destructive",
          success: "!text-success [&_[data-icon]]:!text-success",
          warning: "!text-warning [&_[data-icon]]:!text-warning",
          info: "!text-info [&_[data-icon]]:!text-info",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { toast };

import { type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./dialog";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal description */
  description?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Whether clicking backdrop closes modal */
  closeOnBackdropClick?: boolean;
  /** Whether pressing Escape closes modal */
  closeOnEscape?: boolean;
  /** Show close button */
  showCloseButton?: boolean;
  /** Modal content */
  children: ReactNode;
  /** Footer content (buttons, etc.) */
  footer?: ReactNode;
  /** Additional class names for modal container */
  className?: string;
}

const sizeClasses: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-4xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  children,
  footer,
  className,
}: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        hideClose={!showCloseButton}
        className={cn(sizeClasses[size], className)}
        onEscapeKeyDown={(e) => {
          if (!closeOnEscape) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (!closeOnBackdropClick) e.preventDefault();
        }}
      >
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        <div className="text-sm text-foreground">{children}</div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Confirmation modal variant
 */
export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "default";
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            className={
              variant === "warning"
                ? "bg-warning text-primary-foreground hover:bg-warning/85"
                : undefined
            }
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-muted-foreground">{message}</p>
    </Modal>
  );
}

export default Modal;

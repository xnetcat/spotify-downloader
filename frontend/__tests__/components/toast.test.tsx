import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToastProvider, useToast } from "../../src/components/ui/toast";
import { toast as sonnerToast } from "../../src/components/ui/sonner";

// The Control Room toast is a thin shim over sonner. `toast.tsx` imports
// `toast` from `./sonner`, so we mock that module and assert delegation.
vi.mock("../../src/components/ui/sonner", () => {
  let counter = 0;
  return {
    toast: {
      success: vi.fn(() => `id-${++counter}`),
      error: vi.fn(() => `id-${++counter}`),
      warning: vi.fn(() => `id-${++counter}`),
      info: vi.fn(() => `id-${++counter}`),
      dismiss: vi.fn(),
    },
  };
});

// Test component that uses the toast hook
function TestComponent() {
  const toast = useToast();

  return (
    <div>
      <button onClick={() => toast.success("Success message")}>Show Success</button>
      <button onClick={() => toast.error("Error message")}>Show Error</button>
      <button onClick={() => toast.warning("Warning message")}>Show Warning</button>
      <button onClick={() => toast.info("Info message")}>Show Info</button>
      <button onClick={() => toast.addToast("Custom", "success", 10000)}>Custom Toast</button>
    </div>
  );
}

function renderWithProvider(ui?: React.ReactNode) {
  return render(<ToastProvider>{ui || <TestComponent />}</ToastProvider>);
}

describe("Toast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useToast hook", () => {
    it("works without a provider and returns the expected shape", () => {
      let toastContext: ReturnType<typeof useToast> | null = null;

      function TestOutside() {
        toastContext = useToast();
        return null;
      }

      // No provider — must not throw (sonner-backed shim).
      expect(() => render(<TestOutside />)).not.toThrow();
      expect(toastContext).not.toBeNull();
      expect(toastContext!.toasts).toEqual([]);
    });

    it("provides toast methods", () => {
      let toastContext: ReturnType<typeof useToast> | null = null;

      function TestAccess() {
        toastContext = useToast();
        return null;
      }

      renderWithProvider(<TestAccess />);

      expect(toastContext).not.toBeNull();
      expect(typeof toastContext!.success).toBe("function");
      expect(typeof toastContext!.error).toBe("function");
      expect(typeof toastContext!.warning).toBe("function");
      expect(typeof toastContext!.info).toBe("function");
      expect(typeof toastContext!.addToast).toBe("function");
      expect(typeof toastContext!.removeToast).toBe("function");
    });
  });

  describe("delegation to sonner", () => {
    it("delegates success toasts", () => {
      renderWithProvider();

      fireEvent.click(screen.getByText("Show Success"));

      expect(sonnerToast.success).toHaveBeenCalledWith("Success message", undefined);
    });

    it("delegates error toasts", () => {
      renderWithProvider();

      fireEvent.click(screen.getByText("Show Error"));

      expect(sonnerToast.error).toHaveBeenCalledWith("Error message", undefined);
    });

    it("delegates warning toasts", () => {
      renderWithProvider();

      fireEvent.click(screen.getByText("Show Warning"));

      expect(sonnerToast.warning).toHaveBeenCalledWith("Warning message", undefined);
    });

    it("delegates info toasts", () => {
      renderWithProvider();

      fireEvent.click(screen.getByText("Show Info"));

      expect(sonnerToast.info).toHaveBeenCalledWith("Info message", undefined);
    });

    it("passes duration through addToast", () => {
      renderWithProvider();

      fireEvent.click(screen.getByText("Custom Toast"));

      expect(sonnerToast.success).toHaveBeenCalledWith("Custom", { duration: 10000 });
    });
  });

  describe("removeToast", () => {
    it("delegates dismissal to sonner", () => {
      let toastContext: ReturnType<typeof useToast> | null = null;

      function TestRemove() {
        toastContext = useToast();
        return null;
      }

      renderWithProvider(<TestRemove />);
      toastContext!.removeToast("some-id");

      expect(sonnerToast.dismiss).toHaveBeenCalledWith("some-id");
    });
  });

  describe("toast ID", () => {
    it("returns the sonner id when creating a toast", () => {
      let created: unknown = null;

      function TestIds() {
        const toast = useToast();
        return (
          <button
            onClick={() => {
              created = toast.success("Toast");
            }}
          >
            Add
          </button>
        );
      }

      renderWithProvider(<TestIds />);
      fireEvent.click(screen.getByText("Add"));

      expect(typeof created).toBe("string");
    });
  });
});

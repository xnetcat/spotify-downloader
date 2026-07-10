import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToggleSwitch } from "../../src/components/ui/toggle-switch";

describe("ToggleSwitch", () => {
  describe("rendering", () => {
    it("renders switch element", () => {
      render(<ToggleSwitch checked={false} onChange={() => {}} />);

      expect(screen.getByRole("switch")).toBeInTheDocument();
    });

    it("renders a button as the switch", () => {
      render(<ToggleSwitch checked={false} onChange={() => {}} />);

      expect(screen.getByRole("switch").tagName).toBe("BUTTON");
    });

    it("renders label when provided", () => {
      render(
        <ToggleSwitch
          checked={false}
          onChange={() => {}}
          label="Enable notifications"
        />
      );

      expect(screen.getByText("Enable notifications")).toBeInTheDocument();
    });

    it("renders description when provided", () => {
      render(
        <ToggleSwitch
          checked={false}
          onChange={() => {}}
          label="Enable"
          description="Receive push notifications"
        />
      );

      expect(screen.getByText("Receive push notifications")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <ToggleSwitch
          checked={false}
          onChange={() => {}}
          className="custom-toggle"
        />
      );

      expect(container.firstChild).toHaveClass("custom-toggle");
    });
  });

  describe("checked state", () => {
    it("reflects unchecked state", () => {
      render(<ToggleSwitch checked={false} onChange={() => {}} />);

      const switchEl = screen.getByRole("switch");
      expect(switchEl).toHaveAttribute("aria-checked", "false");
      expect(switchEl).toHaveAttribute("data-state", "unchecked");
    });

    it("reflects checked state", () => {
      render(<ToggleSwitch checked={true} onChange={() => {}} />);

      const switchEl = screen.getByRole("switch");
      expect(switchEl).toHaveAttribute("aria-checked", "true");
      expect(switchEl).toHaveAttribute("data-state", "checked");
    });
  });

  describe("state changes", () => {
    it("calls onChange with true when toggling on", () => {
      const handleChange = vi.fn();
      render(<ToggleSwitch checked={false} onChange={handleChange} />);

      fireEvent.click(screen.getByRole("switch"));

      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it("calls onChange with false when toggling off", () => {
      const handleChange = vi.fn();
      render(<ToggleSwitch checked={true} onChange={handleChange} />);

      fireEvent.click(screen.getByRole("switch"));

      expect(handleChange).toHaveBeenCalledWith(false);
    });
  });

  describe("disabled state", () => {
    it("does not call onChange when disabled", () => {
      const handleChange = vi.fn();
      render(<ToggleSwitch checked={false} onChange={handleChange} disabled />);

      fireEvent.click(screen.getByRole("switch"));

      expect(handleChange).not.toHaveBeenCalled();
    });

    it("disables the switch button", () => {
      render(<ToggleSwitch checked={false} onChange={() => {}} disabled />);

      expect(screen.getByRole("switch")).toBeDisabled();
    });

    it("applies disabled styles", () => {
      const { container } = render(
        <ToggleSwitch checked={false} onChange={() => {}} disabled />
      );

      expect(container.firstChild).toHaveClass("opacity-50", "cursor-not-allowed");
    });
  });

  describe("sizes", () => {
    it("applies sm size classes", () => {
      render(<ToggleSwitch checked={false} onChange={() => {}} size="sm" />);

      expect(screen.getByRole("switch")).toHaveClass("h-4", "w-7");
    });

    it("applies md size classes (default)", () => {
      render(<ToggleSwitch checked={false} onChange={() => {}} />);

      expect(screen.getByRole("switch")).toHaveClass("h-5", "w-9");
    });

    it("applies lg size classes", () => {
      render(<ToggleSwitch checked={false} onChange={() => {}} size="lg" />);

      expect(screen.getByRole("switch")).toHaveClass("h-6", "w-11");
    });
  });

  describe("form integration", () => {
    it("applies id to the switch", () => {
      render(
        <ToggleSwitch checked={false} onChange={() => {}} id="my-toggle" />
      );

      expect(screen.getByRole("switch")).toHaveAttribute("id", "my-toggle");
    });

    it("applies name for form submission", () => {
      // Radix Switch mirrors `name` onto a hidden bubble input inside a form.
      const { container } = render(
        <form>
          <ToggleSwitch checked={true} onChange={() => {}} name="notifications" />
        </form>
      );

      expect(container.querySelector('input[name="notifications"]')).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has role switch", () => {
      render(<ToggleSwitch checked={false} onChange={() => {}} />);

      expect(screen.getByRole("switch")).toBeInTheDocument();
    });

    it("label wraps the whole control", () => {
      const { container } = render(
        <ToggleSwitch
          checked={false}
          onChange={() => {}}
          label="Enable feature"
        />
      );

      const label = container.querySelector("label");
      expect(label).toBeInTheDocument();
      expect(label).toHaveTextContent("Enable feature");
    });
  });

  describe("ref forwarding", () => {
    it("forwards ref to the switch button", () => {
      const ref = vi.fn();
      render(<ToggleSwitch checked={false} onChange={() => {}} ref={ref} />);

      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLButtonElement);
    });
  });
});

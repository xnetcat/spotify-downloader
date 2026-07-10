import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Modal, ConfirmModal } from "../../src/components/ui/modal";

describe("Modal", () => {
  describe("rendering", () => {
    it("renders when isOpen is true", () => {
      render(
        <Modal isOpen onClose={() => {}}>
          <p>Modal Content</p>
        </Modal>
      );

      expect(screen.getByText("Modal Content")).toBeInTheDocument();
    });

    it("does not render when isOpen is false", () => {
      render(
        <Modal isOpen={false} onClose={() => {}}>
          <p>Modal Content</p>
        </Modal>
      );

      expect(screen.queryByText("Modal Content")).not.toBeInTheDocument();
    });

    it("renders title when provided", () => {
      render(
        <Modal isOpen onClose={() => {}} title="Test Modal">
          <p>Content</p>
        </Modal>
      );

      expect(screen.getByText("Test Modal")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Test Modal" })).toBeInTheDocument();
    });

    it("renders description when provided", () => {
      render(
        <Modal isOpen onClose={() => {}} title="Title" description="This is a description">
          <p>Content</p>
        </Modal>
      );

      expect(screen.getByText("This is a description")).toBeInTheDocument();
    });

    it("renders footer when provided", () => {
      render(
        <Modal isOpen onClose={() => {}} footer={<button>Submit</button>}>
          <p>Content</p>
        </Modal>
      );

      expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
    });

    it("applies custom className to the dialog", () => {
      render(
        <Modal isOpen onClose={() => {}} className="custom-modal">
          <p>Content</p>
        </Modal>
      );

      expect(screen.getByRole("dialog")).toHaveClass("custom-modal");
    });
  });

  describe("sizes", () => {
    it("applies sm size class", () => {
      render(
        <Modal isOpen onClose={() => {}} size="sm">
          <p>Content</p>
        </Modal>
      );

      expect(screen.getByRole("dialog")).toHaveClass("max-w-sm");
    });

    it("applies md size class (default)", () => {
      render(
        <Modal isOpen onClose={() => {}}>
          <p>Content</p>
        </Modal>
      );

      expect(screen.getByRole("dialog")).toHaveClass("max-w-md");
    });

    it("applies lg size class", () => {
      render(
        <Modal isOpen onClose={() => {}} size="lg">
          <p>Content</p>
        </Modal>
      );

      expect(screen.getByRole("dialog")).toHaveClass("max-w-lg");
    });

    it("applies xl size class", () => {
      render(
        <Modal isOpen onClose={() => {}} size="xl">
          <p>Content</p>
        </Modal>
      );

      expect(screen.getByRole("dialog")).toHaveClass("max-w-xl");
    });

    it("applies full size class", () => {
      render(
        <Modal isOpen onClose={() => {}} size="full">
          <p>Content</p>
        </Modal>
      );

      expect(screen.getByRole("dialog")).toHaveClass("max-w-4xl");
    });
  });

  describe("close button", () => {
    it("shows close button by default", () => {
      render(
        <Modal isOpen onClose={() => {}}>
          <p>Content</p>
        </Modal>
      );

      expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    });

    it("hides close button when showCloseButton is false", () => {
      render(
        <Modal isOpen onClose={() => {}} showCloseButton={false}>
          <p>Content</p>
        </Modal>
      );

      expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    });

    it("calls onClose when close button is clicked", () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen onClose={handleClose}>
          <p>Content</p>
        </Modal>
      );

      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("backdrop / content clicks", () => {
    it("does not close when clicking modal content", () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen onClose={handleClose}>
          <p>Content</p>
        </Modal>
      );

      fireEvent.click(screen.getByText("Content"));
      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe("keyboard interactions", () => {
    it("closes modal on Escape key by default", () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen onClose={handleClose}>
          <p>Content</p>
        </Modal>
      );

      fireEvent.keyDown(document.body, { key: "Escape" });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("does not close on Escape when closeOnEscape is false", () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen onClose={handleClose} closeOnEscape={false}>
          <p>Content</p>
        </Modal>
      );

      fireEvent.keyDown(document.body, { key: "Escape" });
      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe("accessibility", () => {
    it("has role dialog", () => {
      render(
        <Modal isOpen onClose={() => {}}>
          <p>Content</p>
        </Modal>
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("labels the dialog when a title is provided", () => {
      render(
        <Modal isOpen onClose={() => {}} title="Modal Title">
          <p>Content</p>
        </Modal>
      );

      expect(screen.getByRole("dialog")).toHaveAttribute("aria-labelledby");
    });

    it("describes the dialog when a description is provided", () => {
      render(
        <Modal isOpen onClose={() => {}} title="Title" description="Modal description">
          <p>Content</p>
        </Modal>
      );

      expect(screen.getByRole("dialog")).toHaveAttribute("aria-describedby");
    });
  });
});

describe("ConfirmModal", () => {
  describe("rendering", () => {
    it("renders title and message", () => {
      render(
        <ConfirmModal
          isOpen
          onClose={() => {}}
          onConfirm={() => {}}
          title="Confirm Delete"
          message="Are you sure you want to delete this item?"
        />
      );

      expect(screen.getByText("Confirm Delete")).toBeInTheDocument();
      expect(screen.getByText("Are you sure you want to delete this item?")).toBeInTheDocument();
    });

    it("renders default button texts", () => {
      render(
        <ConfirmModal
          isOpen
          onClose={() => {}}
          onConfirm={() => {}}
          title="Confirm"
          message="Confirm action?"
        />
      );

      expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    });

    it("renders custom button texts", () => {
      render(
        <ConfirmModal
          isOpen
          onClose={() => {}}
          onConfirm={() => {}}
          title="Delete"
          message="Delete this?"
          confirmText="Yes, delete"
          cancelText="No, keep it"
        />
      );

      expect(screen.getByRole("button", { name: "Yes, delete" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "No, keep it" })).toBeInTheDocument();
    });
  });

  describe("actions", () => {
    it("calls onConfirm when confirm button is clicked", () => {
      const handleConfirm = vi.fn();
      render(
        <ConfirmModal
          isOpen
          onClose={() => {}}
          onConfirm={handleConfirm}
          title="Confirm"
          message="Confirm?"
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when cancel button is clicked", () => {
      const handleClose = vi.fn();
      render(
        <ConfirmModal
          isOpen
          onClose={handleClose}
          onConfirm={() => {}}
          title="Confirm"
          message="Confirm?"
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("variants", () => {
    it("applies danger variant styles", () => {
      render(
        <ConfirmModal
          isOpen
          onClose={() => {}}
          onConfirm={() => {}}
          title="Delete"
          message="Delete this?"
          variant="danger"
        />
      );

      expect(screen.getByRole("button", { name: "Confirm" })).toHaveClass("bg-destructive");
    });

    it("applies primary styles for the default variant", () => {
      render(
        <ConfirmModal
          isOpen
          onClose={() => {}}
          onConfirm={() => {}}
          title="Confirm"
          message="Proceed?"
          variant="default"
        />
      );

      expect(screen.getByRole("button", { name: "Confirm" })).toHaveClass("bg-primary");
    });

    it("uses warning styles for the warning variant", () => {
      render(
        <ConfirmModal
          isOpen
          onClose={() => {}}
          onConfirm={() => {}}
          title="Warning"
          message="Are you sure?"
          variant="warning"
        />
      );

      expect(screen.getByRole("button", { name: "Confirm" })).toHaveClass("bg-warning");
    });
  });

  describe("loading state", () => {
    it("shows a spinner in the confirm button when loading", () => {
      render(
        <ConfirmModal
          isOpen
          onClose={() => {}}
          onConfirm={() => {}}
          title="Confirm"
          message="Confirm?"
          isLoading
        />
      );

      const confirmButton = screen.getByRole("button", { name: "Confirm" });
      expect(confirmButton.querySelector("svg.animate-spin")).toBeInTheDocument();
    });

    it("disables buttons when loading", () => {
      render(
        <ConfirmModal
          isOpen
          onClose={() => {}}
          onConfirm={() => {}}
          title="Confirm"
          message="Confirm?"
          isLoading
        />
      );

      expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    });
  });
});

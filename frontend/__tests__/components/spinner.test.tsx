import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Spinner, Loading, WaveformLoader, EqualizerLoader, Skeleton } from "../../src/components/ui/spinner";

describe("Spinner", () => {
  it("renders the spinner", () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders with default size (md)", () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector("svg")).toHaveClass("size-8");
  });

  it("renders with small size", () => {
    const { container } = render(<Spinner size="sm" />);
    expect(container.querySelector("svg")).toHaveClass("size-4");
  });

  it("renders with large size", () => {
    const { container } = render(<Spinner size="lg" />);
    expect(container.querySelector("svg")).toHaveClass("size-12");
  });

  it("applies custom className", () => {
    const { container } = render(<Spinner className="custom-spinner" />);
    expect(container.firstChild).toHaveClass("custom-spinner");
  });

  it("is animated", () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector("svg")).toHaveClass("animate-spin");
  });

  it("exposes a loading status role", () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toHaveAttribute("role", "status");
    expect(container.firstChild).toHaveAttribute("aria-label", "Loading");
  });
});

describe("Loading", () => {
  it("renders with default text", () => {
    const { getByText } = render(<Loading />);
    expect(getByText("Loading…")).toBeInTheDocument();
  });

  it("renders with custom text", () => {
    const { getByText } = render(<Loading text="Please wait..." />);
    expect(getByText("Please wait...")).toBeInTheDocument();
  });

  it("renders without text when empty string", () => {
    const { queryByText } = render(<Loading text="" />);
    expect(queryByText("Loading…")).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<Loading className="custom-loading" />);
    expect(container.firstChild).toHaveClass("custom-loading");
  });

  it("centers content", () => {
    const { container } = render(<Loading />);
    expect(container.firstChild).toHaveClass("flex", "items-center", "justify-center");
  });

  it("renders waveform variant by default", () => {
    const { container } = render(<Loading />);
    expect(container.querySelector(".meter-cell")).toBeInTheDocument();
  });

  it("renders spinner variant", () => {
    const { container } = render(<Loading variant="spinner" />);
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders equalizer variant", () => {
    const { container } = render(<Loading variant="equalizer" />);
    expect(container.querySelector(".meter-cell")).toBeInTheDocument();
  });
});

describe("WaveformLoader", () => {
  it("renders meter cells", () => {
    const { container } = render(<WaveformLoader />);
    const cells = container.querySelectorAll(".meter-cell");
    expect(cells.length).toBe(5);
  });

  it("renders custom number of cells", () => {
    const { container } = render(<WaveformLoader bars={3} />);
    const cells = container.querySelectorAll(".meter-cell");
    expect(cells.length).toBe(3);
  });

  it("applies custom className", () => {
    const { container } = render(<WaveformLoader className="custom-waveform" />);
    expect(container.firstChild).toHaveClass("custom-waveform");
  });
});

describe("EqualizerLoader", () => {
  it("renders meter cells", () => {
    const { container } = render(<EqualizerLoader />);
    const cells = container.querySelectorAll(".meter-cell");
    expect(cells.length).toBe(5);
  });

  it("has meter class", () => {
    const { container } = render(<EqualizerLoader />);
    expect(container.firstChild).toHaveClass("meter");
  });

  it("applies custom className", () => {
    const { container } = render(<EqualizerLoader className="custom-equalizer" />);
    expect(container.firstChild).toHaveClass("custom-equalizer");
  });
});

describe("Skeleton", () => {
  it("renders a pulsing placeholder", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass("animate-pulse", "rounded-md", "bg-elevated");
  });

  it("applies custom className", () => {
    const { container } = render(<Skeleton className="custom-skeleton" />);
    expect(container.firstChild).toHaveClass("custom-skeleton");
  });
});

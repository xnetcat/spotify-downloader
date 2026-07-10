import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  MatchScoreGauge,
  MatchScoreBar,
  ScoreBadge,
} from "../../src/components/ui/match-gauge";

describe("MatchScoreGauge", () => {
  describe("rendering", () => {
    it("renders with score label by default", () => {
      render(<MatchScoreGauge score={85} />);

      expect(screen.getByText("85")).toBeInTheDocument();
    });

    it("rounds decimal scores", () => {
      render(<MatchScoreGauge score={85.7} />);

      expect(screen.getByText("86")).toBeInTheDocument();
    });

    it("hides label when showLabel is false", () => {
      render(<MatchScoreGauge score={85} showLabel={false} />);

      expect(screen.queryByText("85")).not.toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <MatchScoreGauge score={85} className="custom-gauge" />
      );

      expect(container.firstChild).toHaveClass("custom-gauge");
    });

    it("renders a segmented meter", () => {
      const { container } = render(<MatchScoreGauge score={85} />);

      expect(container.querySelector('[role="meter"]')).toBeInTheDocument();
      expect(container.querySelectorAll(".meter-cell").length).toBeGreaterThan(0);
    });
  });

  describe("sizes", () => {
    it("renders more cells for larger sizes", () => {
      const small = render(<MatchScoreGauge score={85} size="sm" />);
      expect(small.container.querySelectorAll(".meter-cell").length).toBe(12);

      const medium = render(<MatchScoreGauge score={85} size="md" />);
      expect(medium.container.querySelectorAll(".meter-cell").length).toBe(16);

      const large = render(<MatchScoreGauge score={85} size="lg" />);
      expect(large.container.querySelectorAll(".meter-cell").length).toBe(20);
    });
  });

  describe("color thresholds", () => {
    it("uses success color for high scores (>=75)", () => {
      const { container } = render(<MatchScoreGauge score={95} />);

      expect(container.firstChild).toHaveAttribute("data-score", "95");
      expect(screen.getByText("95").style.color).toBe("var(--success)");
    });

    it("uses warning color for medium scores (>=45)", () => {
      const { container } = render(<MatchScoreGauge score={60} />);

      expect(container.firstChild).toHaveAttribute("data-score", "60");
      expect(screen.getByText("60").style.color).toBe("var(--warning)");
    });

    it("uses destructive color for low scores (<45)", () => {
      const { container } = render(<MatchScoreGauge score={30} />);

      expect(container.firstChild).toHaveAttribute("data-score", "30");
      expect(screen.getByText("30").style.color).toBe("var(--destructive)");
    });

    it("treats 75 as the success boundary", () => {
      render(<MatchScoreGauge score={75} />);
      expect(screen.getByText("75").style.color).toBe("var(--success)");
    });

    it("treats 45 as the warning boundary", () => {
      render(<MatchScoreGauge score={45} />);
      expect(screen.getByText("45").style.color).toBe("var(--warning)");
    });

    it("treats 44 as destructive", () => {
      render(<MatchScoreGauge score={44} />);
      expect(screen.getByText("44").style.color).toBe("var(--destructive)");
    });
  });

  describe("score normalization", () => {
    it("clamps scores above 100 to 100", () => {
      render(<MatchScoreGauge score={150} />);

      expect(screen.getByText("100")).toBeInTheDocument();
    });

    it("clamps negative scores to 0", () => {
      render(<MatchScoreGauge score={-10} />);

      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("handles zero score", () => {
      render(<MatchScoreGauge score={0} />);

      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("handles score of exactly 100", () => {
      render(<MatchScoreGauge score={100} />);

      expect(screen.getByText("100")).toBeInTheDocument();
    });
  });

  describe("animation", () => {
    it("applies animation class when animated is true (default)", () => {
      const { container } = render(<MatchScoreGauge score={85} />);
      expect(container.firstChild).toHaveClass("animate-fade-in");
    });

    it("does not apply animation class when animated is false", () => {
      const { container } = render(<MatchScoreGauge score={85} animated={false} />);
      expect(container.firstChild).not.toHaveClass("animate-fade-in");
    });
  });
});

describe("MatchScoreBar", () => {
  describe("rendering", () => {
    it("renders a segmented meter", () => {
      const { container } = render(<MatchScoreBar score={75} />);

      expect(container.querySelector('[role="meter"]')).toBeInTheDocument();
    });

    it("shows percentage by default", () => {
      render(<MatchScoreBar score={75} />);

      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("hides percentage when showPercentage is false", () => {
      render(<MatchScoreBar score={75} showPercentage={false} />);

      expect(screen.queryByText("75%")).not.toBeInTheDocument();
    });

    it("shows label when showLabel is true", () => {
      render(<MatchScoreBar score={75} showLabel />);

      expect(screen.getByText("Match score")).toBeInTheDocument();
    });

    it("hides label by default", () => {
      render(<MatchScoreBar score={75} />);

      expect(screen.queryByText("Match score")).not.toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <MatchScoreBar score={75} className="custom-bar" />
      );

      expect(container.firstChild).toHaveClass("custom-bar");
    });
  });

  describe("color thresholds", () => {
    it("uses success color for high scores", () => {
      render(<MatchScoreBar score={95} />);
      expect(screen.getByText("95%").style.color).toBe("var(--success)");
    });

    it("uses warning color for medium scores", () => {
      render(<MatchScoreBar score={60} />);
      expect(screen.getByText("60%").style.color).toBe("var(--warning)");
    });

    it("uses destructive color for low scores", () => {
      render(<MatchScoreBar score={30} />);
      expect(screen.getByText("30%").style.color).toBe("var(--destructive)");
    });
  });

  describe("score normalization", () => {
    it("clamps scores above 100", () => {
      render(<MatchScoreBar score={150} />);

      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("clamps negative scores to 0", () => {
      render(<MatchScoreBar score={-10} />);

      expect(screen.getByText("0%")).toBeInTheDocument();
    });
  });
});

describe("ScoreBadge", () => {
  describe("rendering", () => {
    it("renders score with percentage", () => {
      render(<ScoreBadge score={85} />);

      expect(screen.getByText("85%")).toBeInTheDocument();
    });

    it("rounds decimal scores", () => {
      render(<ScoreBadge score={85.4} />);

      expect(screen.getByText("85%")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <ScoreBadge score={85} className="custom-badge" />
      );

      expect(container.firstChild).toHaveClass("custom-badge");
    });
  });

  describe("text color", () => {
    it("uses success color for high scores", () => {
      const { container } = render(<ScoreBadge score={95} />);
      expect((container.firstChild as HTMLElement).style.color).toBe("var(--success)");
    });

    it("uses warning color for medium scores", () => {
      const { container } = render(<ScoreBadge score={50} />);
      expect((container.firstChild as HTMLElement).style.color).toBe("var(--warning)");
    });

    it("uses destructive color for low scores", () => {
      const { container } = render(<ScoreBadge score={30} />);
      expect((container.firstChild as HTMLElement).style.color).toBe("var(--destructive)");
    });
  });

  describe("score normalization", () => {
    it("clamps scores above 100", () => {
      render(<ScoreBadge score={150} />);

      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("clamps negative scores to 0", () => {
      render(<ScoreBadge score={-10} />);

      expect(screen.getByText("0%")).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("has pill/badge shape", () => {
      const { container } = render(<ScoreBadge score={85} />);

      expect(container.firstChild).toHaveClass("rounded-full");
    });

    it("uses monospace font", () => {
      const { container } = render(<ScoreBadge score={85} />);

      expect(container.firstChild).toHaveClass("font-mono");
    });
  });
});

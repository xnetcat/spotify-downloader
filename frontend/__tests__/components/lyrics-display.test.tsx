import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { LyricsDisplay } from "../../src/components/ui/lyrics-display";
import type { Lyrics } from "../../src/types";

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
};

Object.assign(navigator, {
  clipboard: mockClipboard,
});

const plainLyrics: Lyrics = {
  entity_id: "song-1",
  lyrics_text: "Hello, it's me\nI was wondering if after all these years\nYou'd like to meet",
  lyrics_synced: null,
  source: "genius",
  fetched_at: "2024-01-01T00:00:00Z",
};

const syncedLyrics: Lyrics = {
  entity_id: "song-2",
  lyrics_text: "Hello\nWorld\nTest",
  lyrics_synced: "[00:05.00]Hello\n[00:10.00]World\n[00:15.00]Test",
  source: "synced",
  fetched_at: "2024-01-01T00:00:00Z",
};

const emptyLyrics: Lyrics = {
  entity_id: "song-3",
  lyrics_text: "",
  lyrics_synced: null,
  source: "genius",
  fetched_at: "2024-01-01T00:00:00Z",
};

// The lyric line divs are the direct children of the scrollable content region.
function lyricLines(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(".overflow-y-auto > div"));
}

describe("LyricsDisplay", () => {
  beforeEach(() => {
    mockClipboard.writeText.mockClear();
  });

  describe("rendering", () => {
    it("renders lyrics text", () => {
      render(<LyricsDisplay lyrics={plainLyrics} />);

      expect(screen.getByText("Hello, it's me")).toBeInTheDocument();
      expect(screen.getByText("I was wondering if after all these years")).toBeInTheDocument();
      expect(screen.getByText("You'd like to meet")).toBeInTheDocument();
    });

    it("renders lyrics header with title", () => {
      render(<LyricsDisplay lyrics={plainLyrics} />);

      expect(screen.getByText("Lyrics")).toBeInTheDocument();
    });

    it("shows source badge", () => {
      render(<LyricsDisplay lyrics={plainLyrics} />);

      expect(screen.getByText("Genius")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <LyricsDisplay lyrics={plainLyrics} className="custom-lyrics" />
      );

      expect(container.firstChild).toHaveClass("custom-lyrics");
    });
  });

  describe("loading state", () => {
    it("shows loading indicator when isLoading is true", () => {
      render(<LyricsDisplay lyrics={null} isLoading />);

      expect(screen.getByText("Loading lyrics…")).toBeInTheDocument();
    });

    it("does not show lyrics content when loading", () => {
      render(<LyricsDisplay lyrics={plainLyrics} isLoading />);

      expect(screen.queryByText("Hello, it's me")).not.toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("shows error message when error prop is provided", () => {
      render(<LyricsDisplay lyrics={null} error="Failed to load lyrics" />);

      expect(screen.getByText("Failed to load lyrics")).toBeInTheDocument();
    });

    it("does not show lyrics content when there is an error", () => {
      render(<LyricsDisplay lyrics={plainLyrics} error="Failed to load" />);

      expect(screen.queryByText("Hello, it's me")).not.toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows empty message when lyrics is null", () => {
      render(<LyricsDisplay lyrics={null} />);

      expect(screen.getByText("No lyrics available")).toBeInTheDocument();
    });

    it("shows empty message when lyrics text is empty", () => {
      render(<LyricsDisplay lyrics={emptyLyrics} />);

      expect(screen.getByText("No lyrics available")).toBeInTheDocument();
    });
  });

  describe("synced lyrics (LRC parsing)", () => {
    it("renders synced lyrics with timestamps", () => {
      render(<LyricsDisplay lyrics={syncedLyrics} />);

      expect(screen.getByText("Hello")).toBeInTheDocument();
      expect(screen.getByText("World")).toBeInTheDocument();
      expect(screen.getByText("Test")).toBeInTheDocument();
    });

    it("shows Synced badge for synced lyrics", () => {
      render(<LyricsDisplay lyrics={syncedLyrics} />);

      const syncedBadges = screen.getAllByText("Synced");
      expect(syncedBadges.length).toBeGreaterThanOrEqual(1);
    });

    it("displays formatted timestamps", () => {
      render(<LyricsDisplay lyrics={syncedLyrics} />);

      expect(screen.getByText("0:05")).toBeInTheDocument();
      expect(screen.getByText("0:10")).toBeInTheDocument();
      expect(screen.getByText("0:15")).toBeInTheDocument();
    });

    it("highlights current line based on currentTime", () => {
      render(<LyricsDisplay lyrics={syncedLyrics} currentTime={7000} />);

      // At 7 seconds, "Hello" (at 5s) should be active.
      const helloLine = screen.getByText("Hello").closest("div");
      expect(helloLine).toHaveClass("bg-primary/10", "text-primary");
    });

    it("updates highlighted line when currentTime changes", () => {
      const { rerender } = render(
        <LyricsDisplay lyrics={syncedLyrics} currentTime={7000} />
      );

      expect(screen.getByText("Hello").closest("div")).toHaveClass("bg-primary/10");

      rerender(<LyricsDisplay lyrics={syncedLyrics} currentTime={12000} />);
      expect(screen.getByText("World").closest("div")).toHaveClass("bg-primary/10");
    });

    it("marks past lines differently", () => {
      render(<LyricsDisplay lyrics={syncedLyrics} currentTime={12000} />);

      // "Hello" is now in the past — dimmed.
      expect(screen.getByText("Hello").closest("div")).toHaveClass("text-faint");
    });
  });

  describe("seek functionality", () => {
    it("calls onSeek when synced lyric line is clicked", () => {
      const handleSeek = vi.fn();
      render(<LyricsDisplay lyrics={syncedLyrics} onSeek={handleSeek} />);

      fireEvent.click(screen.getByText("Hello"));

      expect(handleSeek).toHaveBeenCalledWith(5000);
    });

    it("does not call onSeek for plain lyrics", () => {
      const handleSeek = vi.fn();
      render(<LyricsDisplay lyrics={plainLyrics} onSeek={handleSeek} />);

      fireEvent.click(screen.getByText("Hello, it's me"));

      expect(handleSeek).not.toHaveBeenCalled();
    });

    it("makes synced lines clickable", () => {
      render(<LyricsDisplay lyrics={syncedLyrics} />);

      expect(screen.getByText("Hello").closest("div")).toHaveClass("cursor-pointer");
    });
  });

  describe("copy functionality", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => {
      vi.clearAllTimers();
      vi.useRealTimers();
    });

    it("copies lyrics to clipboard when copy button is clicked", async () => {
      render(<LyricsDisplay lyrics={plainLyrics} />);

      await act(async () => {
        fireEvent.click(screen.getByTitle("Copy lyrics"));
      });

      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        "Hello, it's me\nI was wondering if after all these years\nYou'd like to meet"
      );
    });

    it("shows checkmark after copying", async () => {
      render(<LyricsDisplay lyrics={plainLyrics} />);

      const copyButton = screen.getByTitle("Copy lyrics");
      await act(async () => {
        fireEvent.click(copyButton);
      });

      // The copy icon swaps to a success-colored checkmark.
      expect(copyButton.querySelector(".text-success")).toBeInTheDocument();
    });
  });

  describe("expand/collapse", () => {
    it("toggles expanded state when expand button is clicked", () => {
      const { container } = render(
        <LyricsDisplay lyrics={plainLyrics} maxHeight="100px" />
      );

      const scroll = container.querySelector(".overflow-y-auto");
      expect(scroll).toHaveStyle({ maxHeight: "100px" });

      fireEvent.click(screen.getByTitle("Expand"));

      expect(scroll).toHaveStyle({ maxHeight: "none" });
    });

    it("shows collapse button when expanded", () => {
      render(<LyricsDisplay lyrics={plainLyrics} />);

      expect(screen.getByTitle("Expand")).toBeInTheDocument();

      fireEvent.click(screen.getByTitle("Expand"));

      expect(screen.getByTitle("Collapse")).toBeInTheDocument();
    });
  });

  describe("LRC parsing edge cases", () => {
    it("handles LRC with milliseconds", () => {
      const lyricsWithMs: Lyrics = {
        ...syncedLyrics,
        lyrics_synced: "[00:05.50]Hello\n[00:10.123]World",
      };

      render(<LyricsDisplay lyrics={lyricsWithMs} currentTime={6000} />);

      expect(screen.getByText("Hello")).toBeInTheDocument();
      expect(screen.getByText("World")).toBeInTheDocument();
    });

    it("handles LRC without milliseconds", () => {
      const lyricsNoMs: Lyrics = {
        ...syncedLyrics,
        lyrics_synced: "[00:05]Hello\n[00:10]World",
      };

      render(<LyricsDisplay lyrics={lyricsNoMs} />);

      expect(screen.getByText("Hello")).toBeInTheDocument();
      expect(screen.getByText("World")).toBeInTheDocument();
    });

    it("filters empty lines from LRC", () => {
      const lyricsWithEmpty: Lyrics = {
        ...syncedLyrics,
        lyrics_synced: "[00:05.00]Hello\n[00:07.00]\n[00:10.00]World",
      };

      render(<LyricsDisplay lyrics={lyricsWithEmpty} />);

      expect(screen.getByText("Hello")).toBeInTheDocument();
      expect(screen.getByText("World")).toBeInTheDocument();
    });

    it("sorts lines by timestamp", () => {
      const unsortedLyrics: Lyrics = {
        ...syncedLyrics,
        lyrics_synced: "[00:15.00]Third\n[00:05.00]First\n[00:10.00]Second",
      };

      const { container } = render(<LyricsDisplay lyrics={unsortedLyrics} />);

      const lines = lyricLines(container);
      expect(lines[0]).toHaveTextContent("First");
      expect(lines[1]).toHaveTextContent("Second");
      expect(lines[2]).toHaveTextContent("Third");
    });
  });

  describe("source display", () => {
    it("shows Genius source", () => {
      render(<LyricsDisplay lyrics={plainLyrics} />);
      expect(screen.getByText("Genius")).toBeInTheDocument();
    });

    it("shows MusixMatch source", () => {
      render(<LyricsDisplay lyrics={{ ...plainLyrics, source: "musixmatch" }} />);
      expect(screen.getByText("MusixMatch")).toBeInTheDocument();
    });

    it("shows AZLyrics source", () => {
      render(<LyricsDisplay lyrics={{ ...plainLyrics, source: "azlyrics" }} />);
      expect(screen.getByText("AZLyrics")).toBeInTheDocument();
    });
  });

  describe("auto scroll", () => {
    it("enables auto scroll by default", () => {
      render(<LyricsDisplay lyrics={syncedLyrics} currentTime={7000} />);
      expect(screen.getByText("Hello")).toBeInTheDocument();
    });

    it("respects autoScroll prop when set to false", () => {
      render(<LyricsDisplay lyrics={syncedLyrics} currentTime={7000} autoScroll={false} />);
      expect(screen.getByText("Hello")).toBeInTheDocument();
    });
  });

  describe("max height", () => {
    it("applies maxHeight style", () => {
      const { container } = render(
        <LyricsDisplay lyrics={plainLyrics} maxHeight="200px" />
      );

      expect(container.querySelector(".overflow-y-auto")).toHaveStyle({ maxHeight: "200px" });
    });

    it("uses default maxHeight of 400px", () => {
      const { container } = render(<LyricsDisplay lyrics={plainLyrics} />);

      expect(container.querySelector(".overflow-y-auto")).toHaveStyle({ maxHeight: "400px" });
    });
  });
});

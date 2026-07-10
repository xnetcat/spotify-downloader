import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface SubmitLyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { source: string; lyricsText: string; lyricsSynced?: string | null }) => void;
  isSubmitting: boolean;
}

const inputClass = cn(
  "h-9 w-full rounded-md border border-input bg-surface px-3 text-sm text-foreground",
  "placeholder:text-faint outline-none transition-colors",
  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
);

export function SubmitLyricsModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: SubmitLyricsModalProps) {
  const [source, setSource] = useState("user");
  const [lyricsText, setLyricsText] = useState("");
  const [lyricsSynced, setLyricsSynced] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lyricsText.trim()) return;
    onSubmit({
      source: source.trim() || "user",
      lyricsText: lyricsText.trim(),
      lyricsSynced: lyricsSynced.trim() || null,
    });
  };

  const footer = (
    <>
      <Button type="button" variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button
        type="button"
        variant="primary"
        disabled={isSubmitting || !lyricsText.trim()}
        onClick={handleSubmit}
      >
        {isSubmitting ? "Submitting…" : "Submit lyrics"}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit lyrics"
      description="Add lyrics from another source or provide your own translation."
      size="lg"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="source">Source / provider name</Label>
          <input
            id="source"
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g. my translation, AnimeLyrics"
            className={inputClass}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lyricsText">Plain text lyrics</Label>
          <Textarea
            id="lyricsText"
            value={lyricsText}
            onChange={(e) => setLyricsText(e.target.value)}
            placeholder="Paste the plain text lyrics here"
            className="min-h-40 font-mono whitespace-pre"
            rows={8}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lyricsSynced">
            Synced lyrics (LRC) <span className="text-faint">(optional)</span>
          </Label>
          <Textarea
            id="lyricsSynced"
            value={lyricsSynced}
            onChange={(e) => setLyricsSynced(e.target.value)}
            placeholder="[00:12.34] Example synced lyric verse"
            className="min-h-32 font-mono whitespace-pre"
            rows={6}
          />
        </div>
      </form>
    </Modal>
  );
}

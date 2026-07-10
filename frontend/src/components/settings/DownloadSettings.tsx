import { useSettingsStore } from "@/stores/settings";
import type { AudioQuality, FilenameRestrict } from "@/stores/settings";
import { Input, Select, Slider } from "@/components/ui";
import { SettingsSection, SettingRow, SettingBlock } from "./SettingsSection";
import { useSettingsContext } from "./SettingsContext";

const FORMAT_OPTIONS = [
  { value: "mp3", label: "MP3" },
  { value: "flac", label: "FLAC" },
  { value: "ogg", label: "OGG Vorbis" },
  { value: "m4a", label: "M4A (AAC)" },
  { value: "opus", label: "Opus" },
  { value: "wav", label: "WAV" },
];

const QUALITY_OPTIONS = [
  { value: "best", label: "Best available" },
  { value: "320k", label: "320 kbps" },
  { value: "256k", label: "256 kbps" },
  { value: "192k", label: "192 kbps" },
  { value: "128k", label: "128 kbps" },
];

const OVERWRITE_OPTIONS = [
  { value: "skip", label: "Skip existing" },
  { value: "force", label: "Overwrite" },
  { value: "metadata", label: "Update metadata only" },
];

const RESTRICT_OPTIONS = [
  { value: "", label: "Default" },
  { value: "strict", label: "Strict (ASCII-safe)" },
  { value: "loose", label: "Loose (remove accents)" },
];

const TEMPLATE_TOKENS =
  "{artist} {artists} {title} {album} {album-artist} {year} {track_number} {genre} {isrc} {list-name} {list-position}";

export function DownloadSettings() {
  const {
    audioFormat,
    audioQuality,
    outputTemplate,
    outputDirectory,
    maxConcurrentDownloads,
    overwrite,
    restrict,
    update,
  } = useSettingsStore();

  const { changeSelect, changeInput, showSuccess, triggerAutoSave } = useSettingsContext();
  const lossless = audioFormat === "flac" || audioFormat === "wav";

  return (
    <SettingsSection
      id="download"
      title="Download"
      description="Audio format, quality, and where files land."
    >
      <SettingRow label="Audio format" help="Container and codec for downloaded files.">
        <Select
          options={FORMAT_OPTIONS}
          value={audioFormat}
          onChange={changeSelect("audioFormat", "Audio format")}
          className="w-full sm:w-56"
        />
      </SettingRow>

      <SettingRow label="Audio quality" help="Target bitrate ceiling for lossy formats.">
        <Select
          options={QUALITY_OPTIONS}
          value={audioQuality}
          onChange={changeSelect("audioQuality", "Audio quality")}
          className="w-full sm:w-56"
        />
      </SettingRow>

      <SettingBlock>
        <Slider
          label="Bitrate"
          value={audioQuality === "best" ? 320 : parseInt(audioQuality.replace("k", ""))}
          min={128}
          max={320}
          step={32}
          onChange={(val) => {
            if (val >= 320) update("audioQuality", "best");
            else update("audioQuality", `${val}k` as AudioQuality);
            showSuccess("Bitrate updated");
            triggerAutoSave();
          }}
          formatValue={(v) => `${v} kbps`}
          disabled={lossless}
        />
        {lossless && (
          <p className="mt-2 text-xs text-muted-foreground">
            Bitrate is fixed for lossless formats.
          </p>
        )}
      </SettingBlock>

      <SettingRow
        label="Output template"
        help={
          <>
            Tokens:{" "}
            <code className="font-mono text-foreground">{TEMPLATE_TOKENS}</code>
          </>
        }
      >
        <Input
          value={outputTemplate}
          onChange={changeInput("outputTemplate", "Output template")}
          placeholder="{artist} - {title}"
          className="w-full sm:w-64"
        />
      </SettingRow>

      <SettingRow label="Output directory" help="Base folder for saved audio.">
        <Input
          value={outputDirectory}
          onChange={changeInput("outputDirectory", "Output directory")}
          placeholder="~/Music/SpotDL"
          className="w-full sm:w-64"
        />
      </SettingRow>

      <SettingBlock>
        <Slider
          label="Concurrent downloads"
          value={maxConcurrentDownloads}
          min={1}
          max={10}
          step={1}
          onChange={(val) => {
            update("maxConcurrentDownloads", val);
            showSuccess("Concurrent downloads updated");
            triggerAutoSave();
          }}
          formatValue={(v) => `${v} download${v > 1 ? "s" : ""}`}
        />
      </SettingBlock>

      <SettingRow label="Existing files" help="What to do when a file already exists.">
        <Select
          options={OVERWRITE_OPTIONS}
          value={overwrite}
          onChange={changeSelect("overwrite", "Existing files mode")}
          className="w-full sm:w-56"
        />
      </SettingRow>

      <SettingRow label="Filename sanitization" help="Restrict characters in filenames.">
        <Select
          options={RESTRICT_OPTIONS}
          value={restrict ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            update("restrict", val ? (val as FilenameRestrict) : null);
            showSuccess("Filename sanitization updated");
            triggerAutoSave();
          }}
          className="w-full sm:w-56"
        />
      </SettingRow>
    </SettingsSection>
  );
}

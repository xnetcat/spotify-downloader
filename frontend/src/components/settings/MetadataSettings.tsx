import { useSettingsStore } from "@/stores/settings";
import { Input, Switch } from "@/components/ui";
import { SettingsSection, SettingRow } from "./SettingsSection";
import { useSettingsContext } from "./SettingsContext";

export function MetadataSettings() {
  const { embedMetadata, embedLyrics, embedCover, generateLrc, id3Separator } =
    useSettingsStore();

  const { changeSetting, changeInput } = useSettingsContext();

  return (
    <SettingsSection
      id="metadata"
      title="Metadata"
      description="What gets written into downloaded files."
    >
      <SettingRow label="Embed metadata" help="Title, artist, album, year, track number.">
        <Switch
          checked={embedMetadata}
          onCheckedChange={(val) => changeSetting("embedMetadata", val, "Embed metadata")}
        />
      </SettingRow>

      <SettingRow label="Embed lyrics" help="Fetch and embed synced lyrics when available.">
        <Switch
          checked={embedLyrics}
          onCheckedChange={(val) => changeSetting("embedLyrics", val, "Embed lyrics")}
        />
      </SettingRow>

      <SettingRow label="Embed cover art" help="Download and embed album artwork.">
        <Switch
          checked={embedCover}
          onCheckedChange={(val) => changeSetting("embedCover", val, "Embed cover art")}
        />
      </SettingRow>

      <SettingRow label="Generate LRC files" help="Write .lrc sidecar files with synced lyrics.">
        <Switch
          checked={generateLrc}
          onCheckedChange={(val) => changeSetting("generateLrc", val, "Generate LRC files")}
        />
      </SettingRow>

      <SettingRow label="ID3 artist separator" help="Character between multiple artists.">
        <Input
          value={id3Separator}
          onChange={changeInput("id3Separator", "ID3 separator")}
          placeholder="/"
          className="w-full sm:w-24 text-center font-mono"
        />
      </SettingRow>
    </SettingsSection>
  );
}

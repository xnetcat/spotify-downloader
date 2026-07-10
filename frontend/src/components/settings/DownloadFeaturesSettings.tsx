import { useSettingsStore } from "@/stores/settings";
import { Input, Switch } from "@/components/ui";
import { SettingsSection, SettingRow } from "./SettingsSection";
import { useSettingsContext } from "./SettingsContext";

export function DownloadFeaturesSettings() {
  const {
    sponsorBlock,
    skipExplicit,
    scanForSongs,
    playlistNumbering,
    fetchAlbums,
    m3u,
    archive,
  } = useSettingsStore();

  const { changeSetting, changeInput } = useSettingsContext();

  return (
    <SettingsSection
      id="features"
      title="Features"
      description="SponsorBlock, playlists, and content filtering."
    >
      <SettingRow label="SponsorBlock" help="Remove sponsor segments from YouTube audio.">
        <Switch
          checked={sponsorBlock}
          onCheckedChange={(val) => changeSetting("sponsorBlock", val, "SponsorBlock")}
        />
      </SettingRow>

      <SettingRow label="Skip explicit tracks" help="Filter out explicit content from downloads.">
        <Switch
          checked={skipExplicit}
          onCheckedChange={(val) => changeSetting("skipExplicit", val, "Skip explicit tracks")}
        />
      </SettingRow>

      <SettingRow label="Scan for existing songs" help="Check local files by metadata to avoid duplicates.">
        <Switch
          checked={scanForSongs}
          onCheckedChange={(val) => changeSetting("scanForSongs", val, "Scan for existing songs")}
        />
      </SettingRow>

      <SettingRow label="Playlist numbering" help="Prepend track numbers to playlist filenames.">
        <Switch
          checked={playlistNumbering}
          onCheckedChange={(val) => changeSetting("playlistNumbering", val, "Playlist numbering")}
        />
      </SettingRow>

      <SettingRow label="Fetch full albums for artists" help="Download all album tracks when downloading an artist.">
        <Switch
          checked={fetchAlbums}
          onCheckedChange={(val) => changeSetting("fetchAlbums", val, "Fetch full albums")}
        />
      </SettingRow>

      <SettingRow label="M3U playlist file" help="Template for a generated playlist file.">
        <Input
          value={m3u}
          onChange={changeInput("m3u", "M3U template")}
          placeholder="{list}.m3u8"
          className="w-full sm:w-64"
        />
      </SettingRow>

      <SettingRow label="Archive file" help="Track downloads to skip on re-runs.">
        <Input
          value={archive}
          onChange={changeInput("archive", "Archive file")}
          placeholder="Path to archive file"
          className="w-full sm:w-64"
        />
      </SettingRow>
    </SettingsSection>
  );
}

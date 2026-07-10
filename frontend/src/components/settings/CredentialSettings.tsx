import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useSettingsStore } from "@/stores/settings";
import { Input, Switch } from "@/components/ui";
import { SettingsSection, SettingRow, SettingBlock } from "./SettingsSection";
import { useSettingsContext } from "./SettingsContext";

export function CredentialSettings() {
  const { spotifyClientId, spotifyClientSecret, spotifyUserAuth } = useSettingsStore();
  const { changeSetting, changeInput } = useSettingsContext();
  const [showSecrets, setShowSecrets] = useState(false);

  return (
    <SettingsSection
      id="credentials"
      title="Credentials"
      description="Optional Spotify API keys for better rate limits."
    >
      <SettingBlock>
        <p className="text-sm text-muted-foreground">
          Get your credentials from the{" "}
          <a
            href="https://developer.spotify.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-info underline-offset-4 hover:underline"
          >
            Spotify developer dashboard
          </a>
          .
        </p>
      </SettingBlock>

      <SettingRow label="Client ID" help="Your Spotify application client ID.">
        <Input
          value={spotifyClientId}
          onChange={changeInput("spotifyClientId", "Client ID")}
          placeholder="Your Spotify client ID"
          className="w-full font-mono sm:w-72"
        />
      </SettingRow>

      <SettingRow label="Client secret" help="Kept in your browser; never shared.">
        <div className="relative w-full sm:w-72">
          <Input
            type={showSecrets ? "text" : "password"}
            value={spotifyClientSecret}
            onChange={changeInput("spotifyClientSecret", "Client secret")}
            placeholder="Your Spotify client secret"
            className="w-full pr-10 font-mono"
          />
          <button
            type="button"
            onClick={() => setShowSecrets((s) => !s)}
            aria-label={showSecrets ? "Hide client secret" : "Show client secret"}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {showSecrets ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </SettingRow>

      <SettingRow
        label="Use Spotify OAuth"
        help="Enable user authentication for private playlists."
      >
        <Switch
          checked={spotifyUserAuth}
          onCheckedChange={(val) => changeSetting("spotifyUserAuth", val, "Spotify OAuth")}
        />
      </SettingRow>
    </SettingsSection>
  );
}

import { useSettingsStore } from "@/stores/settings";
import { Input, Select, Slider } from "@/components/ui";
import { useDevConfig } from "@/contexts/DevConfigContext";
import { SettingsSection, SettingRow, SettingBlock } from "./SettingsSection";
import { useSettingsContext } from "./SettingsContext";

const LOG_LEVEL_OPTIONS = [
  { value: "DEBUG", label: "Debug" },
  { value: "INFO", label: "Info" },
  { value: "WARNING", label: "Warning" },
  { value: "ERROR", label: "Error" },
  { value: "CRITICAL", label: "Critical" },
];

export function AdvancedSettings() {
  const { logLevel, cookieFile, proxy, ffmpegArgs, ytDlpArgs, maxFilenameLength, update } =
    useSettingsStore();

  const { features } = useDevConfig();
  const { changeSelect, changeInput, showSuccess, triggerAutoSave } = useSettingsContext();

  return (
    <SettingsSection
      id="advanced"
      title="Advanced"
      description="Proxy, custom arguments, and diagnostics."
    >
      <SettingRow label="Log level" help="Verbosity of server logs.">
        <Select
          options={LOG_LEVEL_OPTIONS}
          value={logLevel}
          onChange={changeSelect("logLevel", "Log level")}
          className="w-full sm:w-56"
        />
      </SettingRow>

      <SettingRow label="Cookie file path" help="cookies.txt for authenticated sources.">
        <Input
          value={cookieFile}
          onChange={changeInput("cookieFile", "Cookie file path")}
          placeholder="Path to cookies.txt"
          className="w-full font-mono sm:w-64"
        />
      </SettingRow>

      <SettingRow label="Proxy" help="HTTP or SOCKS proxy for network requests.">
        <Input
          value={proxy}
          onChange={changeInput("proxy", "Proxy")}
          placeholder="http://proxy:port"
          className="w-full font-mono sm:w-64"
        />
      </SettingRow>

      <SettingRow label="Custom FFmpeg arguments" help="Passed through to FFmpeg.">
        <Input
          value={ffmpegArgs}
          onChange={changeInput("ffmpegArgs", "FFmpeg args")}
          placeholder="-ac 2 -ar 44100"
          className="w-full font-mono sm:w-64"
        />
      </SettingRow>

      <SettingRow label="Custom yt-dlp arguments" help="Passed through to yt-dlp.">
        <Input
          value={ytDlpArgs}
          onChange={changeInput("ytDlpArgs", "yt-dlp args")}
          placeholder="--geo-bypass --extractor-retries 3"
          className="w-full font-mono sm:w-64"
        />
      </SettingRow>

      {features.hasDownloadSettings && (
        <SettingBlock>
          <Slider
            label="Max filename length"
            value={maxFilenameLength}
            min={50}
            max={500}
            step={5}
            onChange={(val) => {
              update("maxFilenameLength", val);
              showSuccess("Max filename length updated");
              triggerAutoSave();
            }}
            formatValue={(v) => `${v} chars`}
          />
        </SettingBlock>
      )}
    </SettingsSection>
  );
}

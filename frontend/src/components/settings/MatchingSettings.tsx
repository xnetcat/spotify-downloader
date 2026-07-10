import { useSettingsStore } from "@/stores/settings";
import { Slider, SortableProviderList, Switch } from "@/components/ui";
import { useProviders } from "@/api";
import { SettingsSection, SettingRow, SettingBlock } from "./SettingsSection";
import { useSettingsContext } from "./SettingsContext";

export function MatchingSettings() {
  const {
    audioSourcePreferences,
    nameMatchThreshold,
    artistMatchThreshold,
    timeMatchThreshold,
    offlineMode,
    update,
    toggleProvider,
  } = useSettingsStore();

  const { data: providersData } = useProviders();
  const { showSuccess, triggerAutoSave } = useSettingsContext();

  return (
    <SettingsSection
      id="matching"
      title="Matching"
      description="How songs are matched to audio sources."
    >
      {providersData && (
        <SettingBlock>
          <SortableProviderList
            label="Audio sources"
            description="Drag to set priority. Higher sources are tried first."
            preferences={audioSourcePreferences}
            providers={providersData.audio_sources}
            onReorder={(prefs) => {
              update("audioSourcePreferences", prefs);
              showSuccess("Audio sources order updated");
              triggerAutoSave();
            }}
            onToggle={(id) => {
              toggleProvider("audio", id);
              showSuccess("Audio source toggled");
              triggerAutoSave();
            }}
          />
        </SettingBlock>
      )}

      <SettingBlock>
        <Slider
          label="Minimum match score"
          value={nameMatchThreshold}
          min={0}
          max={100}
          step={5}
          onChange={(val) => {
            update("nameMatchThreshold", val);
            showSuccess("Minimum match score updated");
            triggerAutoSave();
          }}
          formatValue={(v) => `${v}%`}
        />
      </SettingBlock>

      <SettingRow
        label="Auto-select best match"
        help="Pick the highest scoring match without manual review."
      >
        <Switch
          checked={!offlineMode}
          onCheckedChange={(checked) => {
            update("offlineMode", !checked);
            showSuccess("Auto-select best match updated");
            triggerAutoSave();
          }}
        />
      </SettingRow>

      {offlineMode && (
        <SettingBlock>
          <p className="mb-4 text-xs font-medium uppercase tracking-wider text-faint">
            Advanced thresholds
          </p>
          <div className="space-y-5">
            <Slider
              label="Artist match threshold"
              value={artistMatchThreshold}
              min={0}
              max={100}
              step={5}
              onChange={(val) => {
                update("artistMatchThreshold", val);
                showSuccess("Artist match threshold updated");
                triggerAutoSave();
              }}
              formatValue={(v) => `${v}%`}
            />
            <Slider
              label="Duration match threshold"
              value={timeMatchThreshold}
              min={0}
              max={100}
              step={5}
              onChange={(val) => {
                update("timeMatchThreshold", val);
                showSuccess("Duration match threshold updated");
                triggerAutoSave();
              }}
              formatValue={(v) => `${v}%`}
            />
          </div>
        </SettingBlock>
      )}
    </SettingsSection>
  );
}

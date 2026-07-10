import { useSettingsStore } from "@/stores/settings";
import { SortableProviderList } from "@/components/ui";
import { useProviders } from "@/api";
import { SettingsSection, SettingBlock } from "./SettingsSection";
import { useSettingsContext } from "./SettingsContext";

export function ProviderSettings() {
  const { metadataSourcePreferences, lyricsSourcePreferences, update, toggleProvider } =
    useSettingsStore();

  const { data: providersData } = useProviders();
  const { showSuccess, triggerAutoSave } = useSettingsContext();

  return (
    <SettingsSection
      id="providers"
      title="Providers"
      description="Priority order for metadata and lyrics sources."
    >
      {providersData && (
        <SettingBlock>
          <SortableProviderList
            label="Metadata sources"
            description="Order of preference for fetching song metadata."
            preferences={metadataSourcePreferences}
            providers={providersData.metadata_sources}
            onReorder={(prefs) => {
              update("metadataSourcePreferences", prefs);
              showSuccess("Metadata sources order updated");
              triggerAutoSave();
            }}
            onToggle={(id) => {
              toggleProvider("metadata", id);
              showSuccess("Metadata source toggled");
              triggerAutoSave();
            }}
          />
        </SettingBlock>
      )}

      {providersData && (
        <SettingBlock>
          <SortableProviderList
            label="Lyrics sources"
            description="Order of preference for fetching lyrics."
            preferences={lyricsSourcePreferences}
            providers={providersData.lyrics_sources}
            onReorder={(prefs) => {
              update("lyricsSourcePreferences", prefs);
              showSuccess("Lyrics sources order updated");
              triggerAutoSave();
            }}
            onToggle={(id) => {
              toggleProvider("lyrics", id);
              showSuccess("Lyrics source toggled");
              triggerAutoSave();
            }}
          />
        </SettingBlock>
      )}
    </SettingsSection>
  );
}

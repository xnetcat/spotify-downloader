import { useSettingsStore } from "@/stores/settings";
import { Input, Select, Switch } from "@/components/ui";
import { SettingsSection, SettingRow } from "./SettingsSection";
import { useSettingsContext } from "./SettingsContext";

const TIMEOUT_OPTIONS = [
  { value: "10", label: "10 seconds" },
  { value: "30", label: "30 seconds" },
  { value: "60", label: "1 minute" },
  { value: "120", label: "2 minutes" },
  { value: "300", label: "5 minutes" },
];

export function ServerSettings() {
  const { apiUrl, apiTimeout, offlineMode, update } = useSettingsStore();
  const { changeInput, showSuccess, triggerAutoSave, changeSetting } = useSettingsContext();

  return (
    <SettingsSection
      id="server"
      title="Server"
      description="How the app reaches the backend API."
    >
      <SettingRow label="API URL" help="Base address of the spotDL server.">
        <Input
          value={apiUrl}
          onChange={changeInput("apiUrl", "API URL")}
          placeholder="http://localhost:8000"
          className="w-full font-mono sm:w-72"
        />
      </SettingRow>

      <SettingRow label="API timeout" help="How long to wait before a request fails.">
        <Select
          options={TIMEOUT_OPTIONS}
          value={String(apiTimeout)}
          onChange={(e) => {
            update("apiTimeout", Number(e.target.value));
            showSuccess("API timeout updated");
            triggerAutoSave();
          }}
          className="w-full sm:w-56"
        />
      </SettingRow>

      <SettingRow label="Offline mode" help="Use local matching when the server is unavailable.">
        <Switch
          checked={offlineMode}
          onCheckedChange={(val) => changeSetting("offlineMode", val, "Offline mode")}
        />
      </SettingRow>
    </SettingsSection>
  );
}

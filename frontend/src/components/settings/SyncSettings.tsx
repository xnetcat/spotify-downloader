import { useState } from "react";
import { Cloud, CloudDownload, Download, Upload, RotateCcw, Loader2 } from "lucide-react";
import { useSettingsStore } from "@/stores/settings";
import {
  useUserSettings,
  useUpdateUserSettings,
  apiToStoreSettings,
  storeToApiSettings,
} from "@/api";
import { useAuthStore } from "@/stores/auth";
import { Button, Badge, useToast } from "@/components/ui";
import { SettingsSection, SettingRow } from "./SettingsSection";

export function SyncSettings() {
  const { isAuthenticated } = useAuthStore();
  const { success: showSuccess, error: showError } = useToast();
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");

  const { exportSettings, importSettings, resetToDefaults } = useSettingsStore();

  const { refetch: refetchServerSettings } = useUserSettings();
  const updateSettingsMutation = useUpdateUserSettings();

  const handleSyncToServer = async () => {
    if (!isAuthenticated) return;
    setSyncStatus("syncing");
    try {
      const currentSettings = exportSettings();
      await updateSettingsMutation.mutateAsync(storeToApiSettings(currentSettings));
      setSyncStatus("success");
      showSuccess("Settings saved to server");
      setTimeout(() => setSyncStatus("idle"), 2000);
    } catch {
      setSyncStatus("error");
      showError("Failed to save settings to server");
      setTimeout(() => setSyncStatus("idle"), 3000);
    }
  };

  const handleLoadFromServer = async () => {
    if (!isAuthenticated) return;
    setSyncStatus("syncing");
    try {
      const result = await refetchServerSettings();
      if (result.data) {
        importSettings(apiToStoreSettings(result.data));
      }
      setSyncStatus("success");
      showSuccess("Settings loaded from server");
      setTimeout(() => setSyncStatus("idle"), 2000);
    } catch {
      setSyncStatus("error");
      showError("Failed to load settings from server");
      setTimeout(() => setSyncStatus("idle"), 3000);
    }
  };

  const handleExportToFile = () => {
    const settings = exportSettings();
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spotdl-settings.json";
    a.click();
    URL.revokeObjectURL(url);
    showSuccess("Settings exported to file");
  };

  const handleResetToDefaults = () => {
    resetToDefaults();
    showSuccess("Settings reset to defaults");
  };

  const handleImportFromFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const settings = JSON.parse(text);
        importSettings(settings);
        showSuccess("Settings imported from file");
      } catch {
        showError("Failed to import settings. Please check the file format.");
      }
    };
    input.click();
  };

  return (
    <SettingsSection
      id="sync"
      title="Sync & backup"
      description="Sync settings with the server or export them to a file."
    >
      <SettingRow
        label="Server sync"
        help={
          isAuthenticated
            ? "Save or load your settings from your account."
            : "Sign in to sync settings with the server."
        }
      >
        {isAuthenticated ? (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {syncStatus === "success" && <Badge variant="success">Synced</Badge>}
            {syncStatus === "error" && <Badge variant="error">Sync failed</Badge>}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncToServer}
              disabled={syncStatus === "syncing"}
            >
              {syncStatus === "syncing" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Cloud className="size-4" />
              )}
              Save to server
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadFromServer}
              disabled={syncStatus === "syncing"}
            >
              <CloudDownload className="size-4" />
              Load from server
            </Button>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Not signed in</span>
        )}
      </SettingRow>

      <SettingRow label="Backup file" help="Export or import settings as JSON.">
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Button variant="ghost" size="sm" onClick={handleExportToFile}>
            <Download className="size-4" />
            Export to file
          </Button>
          <Button variant="ghost" size="sm" onClick={handleImportFromFile}>
            <Upload className="size-4" />
            Import from file
          </Button>
        </div>
      </SettingRow>

      <SettingRow
        label="Reset to defaults"
        help="Restore every setting to its original value."
        danger
      >
        <Button variant="danger" size="sm" onClick={handleResetToDefaults}>
          <RotateCcw className="size-4" />
          Reset to defaults
        </Button>
      </SettingRow>
    </SettingsSection>
  );
}

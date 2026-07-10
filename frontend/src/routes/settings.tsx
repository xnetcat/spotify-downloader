import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { Check, Loader2, TriangleAlert } from "lucide-react";
import { useSettingsStore } from "@/stores/settings";
import { useUpdateUserSettings, storeToApiSettings } from "@/api";
import { useAuthStore } from "@/stores/auth";
import { ConnectionStatusDetailed, useToast } from "@/components/ui";
import { useDevConfig } from "@/contexts/DevConfigContext";
import { config } from "@/config";
import { useDebounce } from "@/hooks/useDebounce";
import {
  SettingsProvider,
  SettingsNav,
  SETTINGS_SECTIONS,
  DownloadSettings,
  MetadataSettings,
  DownloadFeaturesSettings,
  ProviderSettings,
  MatchingSettings,
  CredentialSettings,
  ServerSettings,
  AppearanceSettings,
  AdvancedSettings,
  SyncSettings,
} from "@/components/settings";

export const Route = createFileRoute("/settings")({
  beforeLoad: () => {
    if (config.mode === "hosted") {
      throw redirect({ to: "/" });
    }

    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({
        to: "/auth/login",
        search: { redirect: "/settings" },
      });
    }
  },
  component: SettingsPage,
});

function AutoSaveIndicator({
  status,
}: {
  status: "idle" | "saving" | "saved" | "error";
}) {
  if (status === "idle") return null;
  const map = {
    saving: { icon: Loader2, text: "Saving", cls: "text-muted-foreground", spin: true },
    saved: { icon: Check, text: "Saved", cls: "text-success", spin: false },
    error: { icon: TriangleAlert, text: "Save failed", cls: "text-destructive", spin: false },
  } as const;
  const { icon: Icon, text, cls, spin } = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-xs ${cls}`}>
      <Icon className={`size-3.5 ${spin ? "animate-spin" : ""}`} />
      {text}
    </span>
  );
}

function SettingsPage() {
  const { isAuthenticated } = useAuthStore();
  const { features } = useDevConfig();
  const { error: showError } = useToast();
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );

  const exportSettings = useSettingsStore((s) => s.exportSettings);

  const settingsVersion = useRef(0);
  const [pendingSave, setPendingSave] = useState(0);
  const debouncedPendingSave = useDebounce(pendingSave, 2000);

  const triggerPendingSave = useCallback(() => {
    setPendingSave((prev) => prev + 1);
  }, []);

  const updateSettingsMutation = useUpdateUserSettings();

  useEffect(() => {
    if (!isAuthenticated || debouncedPendingSave === 0) return;
    if (settingsVersion.current === debouncedPendingSave) return;
    settingsVersion.current = debouncedPendingSave;

    const autoSave = async () => {
      setAutoSaveStatus("saving");
      try {
        const currentSettings = exportSettings();
        await updateSettingsMutation.mutateAsync(storeToApiSettings(currentSettings));
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus("idle"), 2000);
      } catch (error) {
        setAutoSaveStatus("error");
        const message = error instanceof Error ? error.message : "Unknown error";
        showError(`Failed to auto-save settings: ${message}`);
        setTimeout(() => setAutoSaveStatus("idle"), 3000);
      }
    };

    autoSave();
  }, [debouncedPendingSave, isAuthenticated, exportSettings, updateSettingsMutation, showError]);

  const visibleSections = SETTINGS_SECTIONS.filter(
    (s) => !s.download || features.hasDownloadSettings
  );

  return (
    <SettingsProvider onPendingSave={triggerPendingSave}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-8"
      >
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Settings
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {features.hasDownloadSettings
                ? "Configure download preferences, credentials, and server connection."
                : "Configure server connection and preferences."}
            </p>
          </div>
          <AutoSaveIndicator status={autoSaveStatus} />
        </header>

        <div className="grid gap-8 lg:grid-cols-[184px_1fr]">
          <SettingsNav sections={visibleSections} />

          <div className="min-w-0 space-y-12">
            {features.hasDownloadSettings && (
              <>
                <DownloadSettings />
                <MetadataSettings />
                <DownloadFeaturesSettings />
                <ProviderSettings />
              </>
            )}

            <section id="connection" className="scroll-mt-24">
              <h2 className="text-[0.8125rem] font-semibold uppercase tracking-wider text-foreground">
                Connection
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Live status of the backend connection.
              </p>
              <div className="mt-4">
                <ConnectionStatusDetailed />
              </div>
            </section>

            <MatchingSettings />
            <CredentialSettings />
            <ServerSettings />
            <AppearanceSettings />
            <AdvancedSettings />
            <SyncSettings />
          </div>
        </div>
      </motion.div>
    </SettingsProvider>
  );
}

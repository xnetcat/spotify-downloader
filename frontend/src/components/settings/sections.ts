/** Section metadata shared between the settings page rail and each section. */
export interface SettingsSectionMeta {
  id: string;
  label: string;
  /** Only shown in self-hosted mode (download-capable). */
  download?: boolean;
}

export const SETTINGS_SECTIONS: SettingsSectionMeta[] = [
  { id: "download", label: "Download", download: true },
  { id: "metadata", label: "Metadata", download: true },
  { id: "features", label: "Features", download: true },
  { id: "providers", label: "Providers", download: true },
  { id: "connection", label: "Connection" },
  { id: "matching", label: "Matching" },
  { id: "credentials", label: "Credentials" },
  { id: "server", label: "Server" },
  { id: "appearance", label: "Appearance" },
  { id: "advanced", label: "Advanced" },
  { id: "sync", label: "Sync & backup" },
];

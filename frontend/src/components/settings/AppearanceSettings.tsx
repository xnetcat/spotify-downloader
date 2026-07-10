import { Moon, Sun, Monitor } from "lucide-react";
import { useSettingsStore } from "@/stores/settings";
import type { ThemePreference } from "@/stores/settings";
import { Switch } from "@/components/ui";
import { cn } from "@/lib/utils";
import { SettingsSection, SettingRow } from "./SettingsSection";
import { useSettingsContext } from "./SettingsContext";

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Moon }[] = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
];

function ThemeSegmented({
  value,
  onChange,
}: {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex rounded-md border border-border bg-card p-0.5"
    >
      {THEME_OPTIONS.map(({ value: v, label, icon: Icon }) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(v)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[calc(var(--radius)-4px)] px-3 py-1.5 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-elevated text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function AppearanceSettings() {
  const { theme, compactSidebar, enableAnimations, reduceMotion } = useSettingsStore();
  const { changeSetting } = useSettingsContext();

  return (
    <SettingsSection
      id="appearance"
      title="Appearance"
      description="Theme, layout, and motion preferences."
    >
      <SettingRow label="Theme" help="Color scheme for the interface.">
        <ThemeSegmented
          value={theme}
          onChange={(val) => changeSetting("theme", val, "Theme")}
        />
      </SettingRow>

      <SettingRow label="Compact sidebar" help="Use the icon-only sidebar by default.">
        <Switch
          checked={compactSidebar}
          onCheckedChange={(val) => changeSetting("compactSidebar", val, "Compact sidebar")}
        />
      </SettingRow>

      <SettingRow label="Enable animations" help="Show transitions and meter effects.">
        <Switch
          checked={enableAnimations}
          onCheckedChange={(val) => changeSetting("enableAnimations", val, "Enable animations")}
        />
      </SettingRow>

      <SettingRow label="Reduce motion" help="Minimize animations for accessibility.">
        <Switch
          checked={reduceMotion}
          onCheckedChange={(val) => changeSetting("reduceMotion", val, "Reduce motion")}
        />
      </SettingRow>
    </SettingsSection>
  );
}

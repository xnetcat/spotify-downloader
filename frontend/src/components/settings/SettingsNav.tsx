import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { SettingsSectionMeta } from "./sections";

/**
 * Section navigation for the settings page. Sticky vertical rail on desktop,
 * a horizontal scrolling tab row on mobile. Tracks the section in view.
 */
export function SettingsNav({ sections }: { sections: SettingsSectionMeta[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const ids = sections.map((s) => s.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -60% 0px", threshold: 0 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  const handleClick = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActive(id);
    }
  };

  return (
    <nav aria-label="Settings sections">
      {/* Mobile: horizontal scrolling tab row */}
      <div className="scrollbar-hide -mx-6 flex gap-1 overflow-x-auto px-6 pb-2 lg:hidden">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={handleClick(s.id)}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors",
              active === s.id
                ? "bg-elevated text-primary"
                : "text-faint hover:text-foreground"
            )}
          >
            {s.label}
          </a>
        ))}
      </div>

      {/* Desktop: sticky vertical rail */}
      <div className="sticky top-24 hidden flex-col gap-0.5 lg:flex">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={handleClick(s.id)}
            aria-current={active === s.id ? "true" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors",
              active === s.id
                ? "bg-elevated text-primary"
                : "text-faint hover:bg-accent hover:text-foreground"
            )}
          >
            {s.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

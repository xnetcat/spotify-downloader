# spotDL "Control Room" design system — build contract

Full rationale: `docs/superpowers/specs/2026-07-10-ui-redesign-design.md`. This file is the working contract for anyone writing UI code.

## Non-negotiables

1. **Tokens only.** Use Tailwind token classes wired in `src/index.css`: `bg-background`, `bg-card`, `bg-surface`, `bg-elevated`, `border-border`, `text-foreground`, `text-muted-foreground`, `text-faint`, `text-primary`, `text-info`, `text-success`, `text-warning`, `text-destructive`, `ring-ring`. Never hardcode hexes or zinc/emerald/etc. palette classes. Never use `bg-[var(--...)]` arbitrary values.
2. **cn() from `@/lib/utils`** — not raw clsx/twMerge combos.
3. **Type:** headings get `font-display` (Space Grotesk); data (durations, bitrates, counts, ISRCs, scores, dates) gets `font-mono tnum`; body text is the default IBM Plex Sans. Page titles: `font-display text-2xl font-bold tracking-tight`. Section labels/eyebrows: `text-xs font-medium uppercase tracking-wider text-faint`.
4. **The Meter** (`@/components/ui/meter`) is the ONLY progress/score visualization. No radial gauges, no smooth gradient bars, no shimmer. Use `scoreColor(score)` for match quality. Download progress: `<Meter value={p} max={100} active cells={16}>`.
5. **Flat surfaces.** Cards are `bg-card border border-border rounded-lg`. No glass-morphism, no glow `box-shadow`s, no gradient text, no gradient buttons, no grain overlays. Elevation = `bg-elevated` or a plain `shadow-lg` on floating layers (popover/dialog) only.
6. **Radius scale:** rounded-md for controls, rounded-lg for cards/dialogs. Nothing above `rounded-xl` except avatars/cover art thumbs (`rounded-md`) — never `rounded-2xl`/`3xl` pills except `Badge`.
7. **Icons: lucide-react only.** Size 16 (`size-4`) inline, 20 (`size-5`) nav. Delete inline `<svg>`s on sight.
8. **Motion:** `motion/react` (Motion for React v12). Page enter = one `fadeIn/slide-up` on the content root (`initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} transition={{duration:0.3, ease:[0.16,1,0.3,1]}}`). List stagger ≤ 0.03s/item, capped at 10 items. Hover states are CSS transitions, not Motion. Everything must look fine with `html.reduce-motion`.
9. **Feedback:** toasts via `sonner` (`toast.success("Download started")`). Empty states: icon (size-8, text-faint) + one sentence + one primary action, centered, `py-16`. Loading: `Skeleton` blocks mirroring the final layout. Errors: `Alert` with `variant="destructive"`, name the failing thing, offer retry.
10. **Copy:** sentence case everywhere ("Download queue", not "Download Queue"). Buttons say what they do ("Save changes"). No exclamation marks.
11. **a11y/quality floor:** visible `focus-visible` rings (token `ring-ring`), keyboard reachable menus (Radix handles it), `aria-label` on icon-only buttons, responsive to 360px, dark AND light themes must both work (`.dark` class strategy — components use tokens so this is free unless you hardcode).
12. **Platform colors** (`--color-spotify` etc. / `text-spotify` etc.) are only for platform identity dots/badges/links — never for UI chrome.

## Component inventory (`@/components/ui`)

shadcn/ui (new-york flavor) built on Radix, plus domain pieces. Standard shadcn APIs unless noted:

- `button` — variants: `primary` (amber), `secondary`, `outline`, `ghost`, `danger`, `link`; sizes `sm|md|lg|icon`; `isLoading`, `asChild`. (Compat: legacy call sites pass `variant="primary"` etc. — already the names.)
- `card` — `Card` (+`hover` prop), `CardHeader/Title/Description/Content/Footer`.
- `meter` — `Meter`, `scoreColor`. Signature element, see rule 4.
- `badge`, `input`, `label`, `textarea`, `select` (Radix Select but ALSO keep a compat `Select` accepting `{options, label, error, placeholder}` props like the old native one), `switch` (+ compat `ToggleSwitch`), `slider` (+ compat `RangeSlider`), `checkbox`
- `dialog` (+ compat `Modal`/`ConfirmModal` wrappers preserving the old `{isOpen, onClose, title, size, footer}` API), `alert-dialog`, `sheet`, `drawer` (vaul)
- `dropdown-menu`, `popover`, `tooltip`, `tabs`, `collapsible`, `toggle-group`
- `table` (+ `DataTable` on TanStack Table), `progress`, `skeleton` (+ compat `Spinner`/`Loading`), `separator`, `scroll-area`, `avatar`, `alert`, `kbd`
- `command` (cmdk) — powers the ⌘K palette
- `sonner` — `<Toaster>` mounted in root; compat `useToast`/`ToastProvider` shim re-exported from `ui/toast`
- Domain: `cover-art`, `match-gauge` (rebuilt ON the Meter; keep `MatchScoreGauge/MatchScoreBar/ScoreBadge` exports), `track-row`, `stat-card`, `platform-link`, `metadata-source-badge`, `lyrics-display`, `audio-features-panel` (meters, not radials), `tempo-visualizer`, `key-signature-badge`, `track-info-grid`, `discography-grid`, `related-artists-carousel`, `entity-breadcrumb`, `connection-status`, `sortable-provider-list`, `metadata-source-selector`, `refresh-metadata-button`, `report-modal`, `submit-lyrics-modal`, `entity-error-card`, `data-table`, `stat-card`.

`src/components/ui/index.ts` must keep every export listed in it today (append new ones; never drop).

## Layout shell

Collapsible sidebar (shadcn sidebar pattern, grouped: **Discover** home/search · **Library** queue · **System** settings/account/admin) with app wordmark `spotDL` (font-display, amber dot), sidebar footer = connection status + version. Sticky header: breadcrumb · ⌘K trigger (input-shaped, `Kbd` hint) · live queue pill (count + mini Meter when downloads active) · theme toggle · user menu. Content: `max-w-6xl mx-auto px-6 py-8`. No footer.

## Theme switching

`.dark` on `<html>` (default dark). `useSettingsStore` holds `theme: "dark" | "light" | "system"`; AppearanceSettings controls it. `reduce-motion` class behavior preserved.

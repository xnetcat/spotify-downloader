# spotDL v5 UI Redesign — "Control Room"

Date: 2026-07-10
Scope: complete visual redesign of the web frontend (`frontend/`) and the CLI TUI (`cli/`), preserving all functionality, API integration, stores, and routes.

## Design thesis

spotDL is an operator's tool: you search a catalog, inspect metadata provenance and match quality, and run downloads. The redesign treats the app as a **broadcast control room / signal chain**: precise, monospace-forward data surfaces, segmented meters, and one warm "phosphor amber" accent — an identity that renders natively in *both* a browser and a terminal. That cross-medium coherence is the signature.

Deliberately dropped from the old design: glass-morphism, glow shadows, gradient text, grain overlay, orange/teal/green multi-accent palette, Satoshi/General Sans.

## Tokens

### Color (dark, default)

| Token | Value | Use |
|---|---|---|
| `background` | `#0B0D12` | app background (blue-ink black, not pure black) |
| `surface` | `#12151C` | panels, sidebar |
| `card` | `#171B24` | cards, popovers |
| `elevated` | `#1E2430` | hover, inputs |
| `border` | `#262D3A` | hairlines |
| `foreground` | `#E8EAF0` | primary text |
| `muted-foreground` | `#8B93A7` | secondary text |
| `faint` | `#5A6274` | tertiary/labels |
| `primary` (amber) | `#F5A623` | actions, focus, active states, meters |
| `info` (cyan) | `#56C8D8` | links, secondary signal |
| `success` | `#4ADE80` | completed |
| `destructive` | `#F4506C` | errors |
| `warning` | `#FACC15` | warnings |

Light mode: cool neutral (`#F6F7F9` bg, `#FFFFFF` cards, `#101318` text), same amber primary darkened to `#C77E0A` for contrast. No cream.

Platform colors (Spotify green, etc.) survive as-is — they're brand facts, not theme.

### Type

- **Display/headings:** Space Grotesk (600/700) — techy grotesk, tight tracking.
- **Body/UI:** IBM Plex Sans (400/500/600).
- **Data/mono:** IBM Plex Mono — durations, bitrates, ISRCs, scores, kbd hints. `tabular-nums` everywhere data aligns.

### Signature element

**The segmented meter.** Download progress, match scores, and audio features render as segmented LED-style meters (discrete cells, amber fill, dim unlit cells) — identical language in web (CSS grid cells) and TUI (block glyphs `▰▱`). One motif, spent once, everywhere progress/quality appears.

## Web architecture

- **shadcn/ui foundation** (new-york style, Tailwind v4 `@theme` tokens): button, card, badge, input, select, dialog, sheet, drawer (vaul), dropdown-menu, tabs, tooltip, switch, slider, table, progress, skeleton, separator, scroll-area, command (cmdk), sonner, avatar, alert, breadcrumb, sidebar, collapsible, popover, toggle-group.
- **New packages:** `radix-ui` primitives (via shadcn), `lucide-react`, `class-variance-authority`, `motion` (framer-motion v12), `sonner`, `cmdk`, `vaul`, `@radix-ui/*` as pulled by shadcn.
- **App shell:** collapsible shadcn Sidebar (grouped nav: Discover / Library / System; version + connection status in sidebar footer), sticky header with breadcrumb + ⌘K command trigger + live queue pill (active download count + mini meter) + theme toggle. Footer removed.
- **Pages** rebuilt with the new system; all data hooks (`@tanstack/react-query`), stores (zustand), router structure, and API modules unchanged.
- Motion: one orchestrated page-level fade/stagger via `motion`, hover micro-interactions on rows/cards only. `reduce-motion` behavior preserved.
- Old `components/ui/*` primitives replaced by shadcn equivalents; domain components (match-gauge, cover-art, track-row, audio-features-panel…) redesigned on top of them.

## TUI architecture

- `theme.py` re-tokened to the Control Room palette (same hexes as web dark).
- `app.tcss` rewritten: flatter panels, hairline borders, amber focus/active, segmented-meter progress (`▰▱`), mono-aligned data columns, new NavRail/StatusBar styling to mirror the web sidebar/header.
- Screens keep their widget trees and bindings; visual restyle + spacing/hierarchy pass. Widgets (match_bar, audio_meter, stat_chip, entity_card) redrawn in the meter language.

## Error/empty/loading

- Empty states: one-line invitation + primary action, no illustrations.
- Loading: skeletons (shadcn), no shimmer-text.
- Errors: destructive-bordered alert with the failing thing named and a retry action.

## Testing/verification

- `pnpm type-check`, `pnpm build`, `pnpm test` must pass; e2e selectors preserved where tests depend on them.
- CLI: `pytest`, plus `textual run` smoke + screenshot.

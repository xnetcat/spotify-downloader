"""Theme constants aligned with frontend design system.

Colors are extracted from frontend/src/index.css to ensure visual consistency
between the web frontend and CLI TUI. This is the "Control Room" identity:
a broadcast-console palette — blue-ink black surfaces, hairline borders, and a
single phosphor-amber accent — shared hex-for-hex with the web dark theme.
"""

from __future__ import annotations


class Theme:
    """Frontend-aligned color theme for SpotDL CLI (Control Room)."""

    # ==================== ACCENT COLORS ====================
    # Primary actions, focus, active states, meters — phosphor amber
    PRIMARY = "#f5a623"  # --primary (amber)
    # Focus — collapsed into the single amber accent
    FOCUS = "#f5a623"  # focus ring == primary
    # Secondary signal, links — info cyan
    SECONDARY = "#56c8d8"  # --info (cyan)
    # Success states
    SUCCESS = "#4ade80"  # --success (green)
    # Errors, destructive actions
    ERROR = "#f4506c"  # --destructive (red)
    # Warnings
    WARNING = "#facc15"  # --warning (yellow)

    # ==================== ADDITIONAL TOKENS ====================
    BG_INSET = "#0d0f15"  # Recessed panels for depth
    TEXT_ACCENT = "#eef0f6"  # Bright neutral for titles

    # ==================== BACKGROUND COLORS ====================
    # Blue-ink black ramp, darkest -> lightest
    BG_VOID = "#08090d"  # deepest recess
    # Base background
    BG_CHASSIS = "#0b0d12"  # --background
    # Panel / sidebar surfaces
    BG_PANEL = "#12151c"  # --surface
    # Cards
    BG_ELEVATED = "#171b24"  # --card
    # Elevated surfaces, inputs, modals
    BG_SURFACE = "#1e2430"  # --elevated
    # Hover states
    BG_HOVER = "#262d3a"  # --border tone as hover fill

    # ==================== TEXT COLORS ====================
    TEXT_PRIMARY = "#e8eaf0"  # --foreground
    TEXT_SECONDARY = "#8b93a7"  # --muted-foreground
    TEXT_MUTED = "#5a6274"  # --faint
    TEXT_DIM = "#3a4150"  # below faint (unlit meter cells)

    # ==================== BORDER COLORS ====================
    BORDER = "#262d3a"  # --border
    BORDER_SUBTLE = "#1c222d"  # --border-subtle

    # ==================== TINTS (dark accent chips) ====================
    TINT_PRIMARY = "#2b1d05"  # amber chip bg
    TINT_SUCCESS = "#0d2318"  # green chip bg
    TINT_WARNING = "#2a2205"  # yellow chip bg
    TINT_ERROR = "#2a0e17"  # red chip bg
    TINT_INFO = "#0c2329"  # cyan chip bg

    # ==================== SEGMENTED METER ====================
    METER_LIT = "▰"  # lit LED cell
    METER_UNLIT = "▱"  # unlit LED cell

    # ==================== PLATFORM COLORS ====================
    SPOTIFY = "#1db954"  # --color-spotify
    YOUTUBE = "#ff0000"  # --color-youtube
    YOUTUBE_MUSIC = "#ff0000"  # --color-ytmusic
    DEEZER = "#a238ff"  # --color-deezer
    SOUNDCLOUD = "#ff5500"  # --color-soundcloud
    BANDCAMP = "#1da0c3"  # --color-bandcamp
    APPLE_MUSIC = "#fc3c44"  # --color-apple
    TIDAL = "#000000"  # --color-tidal
    AMAZON = "#ff9900"  # --color-amazon

    # ==================== UNICODE ICONS ====================
    ICON_SEARCH = "⌕"
    ICON_DOWNLOAD = "↓"
    ICON_SETTINGS = "⚙"
    ICON_ACCOUNT = "⚇"
    ICON_MUSIC = "♪"
    ICON_ARTIST = "♫"
    ICON_ALBUM = "◉"
    ICON_PLAYLIST = "≡"
    ICON_CHECK = "✓"
    ICON_CROSS = "✕"
    ICON_ARROW_RIGHT = "→"
    ICON_DOT = "●"


# Platform color mapping for easy lookup
PLATFORM_COLORS: dict[str, str] = {
    "spotify": Theme.SPOTIFY,
    "youtube": Theme.YOUTUBE,
    "youtube_music": Theme.YOUTUBE_MUSIC,
    "deezer": Theme.DEEZER,
    "soundcloud": Theme.SOUNDCLOUD,
    "bandcamp": Theme.BANDCAMP,
    "apple_music": Theme.APPLE_MUSIC,
    "tidal": Theme.TIDAL,
    "amazon": Theme.AMAZON,
}

# Status color mapping
STATUS_COLORS: dict[str, str] = {
    "success": Theme.SUCCESS,
    "error": Theme.ERROR,
    "warning": Theme.WARNING,
    "info": Theme.SECONDARY,
    "pending": Theme.TEXT_MUTED,
}

# Download status colors
DOWNLOAD_STATUS_COLORS: dict[str, str] = {
    "pending": Theme.TEXT_MUTED,
    "searching": Theme.WARNING,
    "downloading": Theme.PRIMARY,
    "converting": Theme.SECONDARY,
    "embedding": Theme.SECONDARY,
    "completed": Theme.SUCCESS,
    "failed": Theme.ERROR,
    "cancelled": Theme.TEXT_MUTED,
}


def get_platform_color(platform: str) -> str:
    """Get the color for a platform.

    Args:
        platform: Platform name (e.g., 'spotify', 'youtube')

    Returns:
        Hex color string
    """
    return PLATFORM_COLORS.get(platform.lower(), Theme.TEXT_MUTED)


def get_status_color(status: str) -> str:
    """Get the color for a status.

    Args:
        status: Status name

    Returns:
        Hex color string
    """
    return STATUS_COLORS.get(status.lower(), Theme.TEXT_MUTED)


def get_download_status_color(status: str) -> str:
    """Get the color for a download status.

    Args:
        status: Download status name

    Returns:
        Hex color string
    """
    return DOWNLOAD_STATUS_COLORS.get(status.lower(), Theme.TEXT_MUTED)


# Rich markup icons for platforms (used in TUI widgets)
PLATFORM_ICONS: dict[str, str] = {
    "spotify": "[green]●[/]",
    "youtube": "[red]●[/]",
    "youtube_music": "[red]●[/]",
    "deezer": "[magenta]●[/]",
    "soundcloud": "[#ff5500]●[/]",
    "bandcamp": "[cyan]●[/]",
    "apple_music": "[white]●[/]",
    "tidal": "[white]●[/]",
    "amazon": "[#ff9900]●[/]",
}


def get_platform_icon(platform: str) -> str:
    """Get Rich markup icon for a platform."""
    return PLATFORM_ICONS.get(platform.lower(), "●")


def segmented_meter(
    value: float,
    width: int = 12,
    lit_color: str | None = None,
    unlit_color: str | None = None,
) -> str:
    """Build Rich markup for a segmented LED meter — the signature element.

    Renders ``width`` discrete cells: lit cells (``▰``) fill proportional to
    ``value`` (clamped to 0..1), remaining cells stay unlit (``▱``). This is the
    same LED-meter language used by the web UI.

    Args:
        value: Fill fraction in the range 0..1.
        width: Total number of cells.
        lit_color: Hex color for lit cells (defaults to amber primary).
        unlit_color: Hex color for unlit cells (defaults to dim).

    Returns:
        Rich markup string.
    """
    lit = lit_color or Theme.PRIMARY
    unlit = unlit_color or Theme.TEXT_DIM
    clamped = max(0.0, min(1.0, value))
    filled = round(clamped * width)
    filled = max(0, min(width, filled))
    parts = []
    if filled:
        parts.append(f"[{lit}]{Theme.METER_LIT * filled}[/]")
    if width - filled:
        parts.append(f"[{unlit}]{Theme.METER_UNLIT * (width - filled)}[/]")
    return "".join(parts)


def score_color(score: float) -> str:
    """Return the meter color for a 0-100 match/quality score.

    >=75 reads as success (green), >=45 as warning (yellow), else error (red).
    """
    if score >= 75:
        return Theme.SUCCESS
    if score >= 45:
        return Theme.WARNING
    return Theme.ERROR


def format_number(num: int) -> str:
    """Format large numbers with K/M suffixes."""
    if num >= 1_000_000:
        return f"{num / 1_000_000:.1f}M"
    elif num >= 1_000:
        return f"{num / 1_000:.1f}K"
    return str(num)


def truncate(text: str, max_len: int) -> str:
    """Truncate text with ellipsis."""
    if len(text) > max_len:
        return text[: max_len - 3] + "..."
    return text


def format_duration(seconds: int) -> str:
    """Format seconds as m:ss or Xh Ym."""
    if seconds >= 3600:
        hours, remainder = divmod(seconds, 3600)
        minutes, _ = divmod(remainder, 60)
        return f"{hours}h {minutes}m"
    minutes, secs = divmod(seconds, 60)
    return f"{minutes}:{secs:02d}"


__all__ = [
    "DOWNLOAD_STATUS_COLORS",
    "PLATFORM_COLORS",
    "PLATFORM_ICONS",
    "STATUS_COLORS",
    "Theme",
    "format_duration",
    "format_number",
    "get_download_status_color",
    "get_platform_color",
    "get_platform_icon",
    "get_status_color",
    "score_color",
    "segmented_meter",
    "truncate",
]

# Convenience aliases for icon access
ICONS = {
    "search": Theme.ICON_SEARCH,
    "download": Theme.ICON_DOWNLOAD,
    "settings": Theme.ICON_SETTINGS,
    "account": Theme.ICON_ACCOUNT,
    "music": Theme.ICON_MUSIC,
    "artist": Theme.ICON_ARTIST,
    "album": Theme.ICON_ALBUM,
    "playlist": Theme.ICON_PLAYLIST,
    "check": Theme.ICON_CHECK,
    "cross": Theme.ICON_CROSS,
    "arrow_right": Theme.ICON_ARROW_RIGHT,
    "dot": Theme.ICON_DOT,
}

"""MatchBar — match row with a score-colored segmented meter."""

from __future__ import annotations

from textual.app import ComposeResult
from textual.containers import Horizontal
from textual.message import Message
from textual.widget import Widget
from textual.widgets import Static

from spotdl_cli.theme import get_platform_icon, score_color, segmented_meter

METER_WIDTH = 16


def _score_meter(score: float) -> str:
    """Segmented meter markup for a 0-100 score, colored by quality band."""
    return segmented_meter(score / 100, width=METER_WIDTH, lit_color=score_color(score))


class MatchBar(Widget, can_focus=True):
    """Single row: platform dot, title, segmented score meter, vote count."""

    DEFAULT_CSS = """
    MatchBar {
        height: 1;
        width: 100%;
        padding: 0 1;
    }
    MatchBar:hover {
        background: #262d3a;
    }
    MatchBar:focus {
        background: #262d3a;
        border-left: thick #f5a623;
    }
    MatchBar .mb-platform {
        width: 3;
    }
    MatchBar .mb-title {
        width: 1fr;
        color: #e8eaf0;
    }
    MatchBar .mb-score {
        width: 24;
    }
    MatchBar .mb-votes {
        width: 8;
        color: #5a6274;
        text-align: right;
    }
    """

    class Selected(Message):
        def __init__(self, match_data: dict) -> None:
            super().__init__()
            self.match_data = match_data

    def __init__(
        self,
        platform: str,
        title: str,
        score: float,
        votes: int = 0,
        match_data: dict | None = None,
        **kwargs,
    ) -> None:
        super().__init__(**kwargs)
        self._platform = platform
        self._title = title
        self._score = score
        self._votes = votes
        self.match_data = match_data or {}

    def compose(self) -> ComposeResult:
        icon = get_platform_icon(self._platform)
        meter = _score_meter(self._score)
        with Horizontal():
            yield Static(icon, classes="mb-platform")
            yield Static(self._title[:35], classes="mb-title")
            yield Static(f"{meter} {self._score:.0f}%", classes="mb-score", markup=True)
            yield Static(
                f"{'↑' if self._votes > 0 else ''}{self._votes}" if self._votes else "",
                classes="mb-votes",
            )

    def on_click(self) -> None:
        self.post_message(self.Selected(self.match_data))

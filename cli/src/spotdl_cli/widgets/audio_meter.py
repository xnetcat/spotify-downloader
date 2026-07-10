"""AudioMeter — segmented LED meter for audio features."""

from __future__ import annotations

from textual.app import ComposeResult
from textual.containers import Horizontal
from textual.widget import Widget
from textual.widgets import Static

from spotdl_cli.theme import Theme, segmented_meter

METER_WIDTH = 16


class AudioMeter(Widget):
    """Label + segmented amber LED meter (▰▱) + value, mono-aligned."""

    DEFAULT_CSS = """
    AudioMeter {
        height: 1;
        width: 100%;
        margin: 0;
    }
    AudioMeter .am-label {
        width: 14;
        color: #8b93a7;
    }
    AudioMeter .am-bar {
        width: auto;
        margin: 0 1;
    }
    AudioMeter .am-value {
        width: 6;
        color: #e8eaf0;
        text-style: bold;
        text-align: right;
    }
    """

    def __init__(
        self,
        label: str,
        value: float = 0.0,
        display_format: str = "percent",
        **kwargs,
    ) -> None:
        super().__init__(**kwargs)
        self._label = label
        self._value = value
        self._format = display_format

    def _bar(self, value: float) -> str:
        return segmented_meter(value, width=METER_WIDTH, lit_color=Theme.PRIMARY)

    def _value_str(self, value: float) -> str:
        if self._format == "percent":
            return f"{value * 100:.0f}%"
        if self._format == "bpm":
            return f"{value:.0f}"
        return f"{value:.2f}"

    def compose(self) -> ComposeResult:
        with Horizontal():
            yield Static(self._label, classes="am-label")
            yield Static(self._bar(self._value), classes="am-bar", markup=True)
            yield Static(self._value_str(self._value), classes="am-value")

    def update_value(self, value: float) -> None:
        self._value = value
        try:
            self.query_one(".am-bar", Static).update(self._bar(value))
            self.query_one(".am-value", Static).update(self._value_str(value))
        except Exception:
            pass

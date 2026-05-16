"""Choose Sora (OpenAI) vs Veo (Google) from an ad script's creative profile."""

from __future__ import annotations

import re
from typing import Literal

VideoProvider = Literal["sora", "veo"]

_AMBIENT_LINE = re.compile(
    r"none\s*[—–-]\s*ambient|ambient\s+only|no\s+spoken|no\s+dialogue",
    re.IGNORECASE,
)
_LINE_FIELD = re.compile(
    r"-\s*Line\s*(?:\([^)]*\))?\s*:\s*(.+?)(?=\n-\s|\n##|\Z)",
    re.IGNORECASE | re.DOTALL,
)
_CAMERA_MOVE_FIELD = re.compile(
    r"-\s*Camera move\s*:\s*(.+?)(?=\n-\s|\n##|\Z)",
    re.IGNORECASE | re.DOTALL,
)

_DIALOGUE_FORMAT_CUES = (
    "storytime",
    "talking to camera",
    "to-camera",
    "to camera",
    "monologue",
    "interview",
    "voiceover with",
    "duet",
    "stitch energy",
    "pov reaction",
    "says to camera",
    "speaks to camera",
    "direct address",
)

_CINEMATIC_CUES = (
    "whip pan",
    "drone",
    "aerial",
    "crane shot",
    "tracking shot",
    "slow motion",
    "slow-mo",
    "montage",
    "quick cut",
    "timelapse",
    "time-lapse",
    "steadicam",
    "orbit shot",
    "macro push",
    "dolly zoom",
    "crane up",
    "chase sequence",
    "one-take",
    "single take",
)

_COMPLEX_CAMERA_WORDS = (
    "whip",
    "drone",
    "aerial",
    "crane",
    "tracking",
    "orbit",
    "steadicam",
    "dolly",
    "gimbal",
    "macro",
    "zoom",
)


def _spoken_line_texts(script: str) -> list[str]:
    lines: list[str] = []
    for raw in _LINE_FIELD.findall(script):
        text = " ".join(raw.split()).strip()
        if not text or _AMBIENT_LINE.search(text):
            continue
        # Drop leading parenthetical stage direction when dialogue follows.
        if text.startswith("(") and ")" in text:
            after = text[text.index(")") + 1 :].strip()
            if after and not _AMBIENT_LINE.search(after):
                text = after
            elif _AMBIENT_LINE.search(text):
                continue
        lines.append(text)
    return lines


def _estimate_spoken_words(script: str) -> int:
    return sum(len(line.split()) for line in _spoken_line_texts(script))


def _count_complex_camera_moves(script: str) -> int:
    count = 0
    for move in _CAMERA_MOVE_FIELD.findall(script):
        lower = move.lower()
        if any(word in lower for word in _COMPLEX_CAMERA_WORDS):
            count += 1
    return count


def choose_video_provider(script: str) -> VideoProvider:
    """Return ``veo`` for dialogue- and performance-led scripts, else ``sora`` for visual-first spots."""
    if not script or not script.strip():
        return "sora"

    lower = script.lower()
    spoken = _spoken_line_texts(script)
    spoken_beats = len(spoken)
    spoken_words = _estimate_spoken_words(script)
    complex_cameras = _count_complex_camera_moves(script)

    dialogue_score = 0
    if spoken_words >= 28:
        dialogue_score += 3
    elif spoken_words >= 14:
        dialogue_score += 2
    elif spoken_words >= 6:
        dialogue_score += 1

    if spoken_beats >= 3:
        dialogue_score += 2
    elif spoken_beats >= 2:
        dialogue_score += 1

    dialogue_score += sum(1 for cue in _DIALOGUE_FORMAT_CUES if cue in lower)

    cinematic_score = 0
    cinematic_score += sum(1 for cue in _CINEMATIC_CUES if cue in lower)
    cinematic_score += min(complex_cameras, 3)

    if spoken_beats <= 1 and spoken_words < 8:
        cinematic_score += 2
    if spoken_beats >= 2 and spoken_words >= 10:
        dialogue_score += 1

    if dialogue_score > cinematic_score:
        return "veo"
    if cinematic_score > dialogue_score:
        return "sora"
    # Tie-break: most ads in this pipeline are spoken; lean Veo when any real dialogue exists.
    if spoken_beats >= 2 or spoken_words >= 12:
        return "veo"
    return "sora"

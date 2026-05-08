"""Shared ad clip duration (VIDEO_SECONDS), audio guard rails, and script beat layout.

Used by `script_creation_worker` and `ad_video_generation_worker` so prompts stay aligned.
"""

from __future__ import annotations

import logging
import os
from typing import List, Tuple

logger = logging.getLogger(__name__)

# Same margins as the video-model prefix (seconds of clip timeline).
AUDIO_START_GUARD = 0.5
AUDIO_END_GUARD = 0.65

BeatSpan = Tuple[float, float, str]


def allowed_video_seconds() -> int:
    """Clip length for `videos.create` (API allows 4, 8, 12). Override with VIDEO_SECONDS."""
    raw = os.getenv("VIDEO_SECONDS", "12").strip()
    try:
        v = int(raw)
    except ValueError:
        return 12
    if v in (4, 8, 12):
        return v
    logger.warning("VIDEO_SECONDS=%r invalid; using 12 (allowed: 4, 8, 12)", raw)
    return 12


def dialogue_end_seconds(total: int) -> float:
    """Last moment on the timeline for spoken dialogue (before final ambience-only tail)."""
    if total == 12:
        return 11.35
    if total == 8:
        return 7.35
    if total == 4:
        return 3.35
    return round(max(0.5, float(total) - 0.73), 2)


def video_prompt_audio_prefix(seconds: int) -> str:
    """Prepended to the script for the video model — speech guard bands scale with clip length."""
    t_end = dialogue_end_seconds(seconds)
    return f"""Mastering / timeline (mandatory — follow exactly):
- First ~{AUDIO_START_GUARD}s: no spoken words — only ambient sound, subtle music bed, room tone, or silence while visuals hook.
- Last ~{AUDIO_END_GUARD}s: no spoken words — only ambience, music tail, light foley, or silence after the final line has fully ended.
- All dialogue must live between ~{AUDIO_START_GUARD}s and ~{t_end}s of this clip; finish complete phrases with a short breath of silence before ~{t_end}s, then hold visuals + non-dialogue audio through the end.
- Avoid hard cuts that start mid-consonant at t≈0 or truncate the final word at the end of the file.

---

"""


def _beat_plan(total: int) -> List[BeatSpan]:
    if total == 12:
        return [
            (0, 2, "hook"),
            (2, 5, "setup"),
            (5, 9, "payoff"),
            (9, 12, "product moment"),
        ]
    if total == 8:
        return [
            (0, 1, "hook"),
            (1, 3, "setup"),
            (3, 6, "payoff"),
            (6, 8, "product moment"),
        ]
    if total == 4:
        return [
            (0, 1, "hook"),
            (1, 2, "setup"),
            (2, 3, "payoff"),
            (3, 4, "product moment"),
        ]
    # Fallback: even quarters
    q = float(total) / 4.0
    return [
        (0 * q, 1 * q, "hook"),
        (1 * q, 2 * q, "setup"),
        (2 * q, 3 * q, "payoff"),
        (3 * q, 4 * q, "product moment"),
    ]


def _fmt_t(t: float) -> str:
    if t == int(t):
        return str(int(t))
    return f"{t:g}"


def _fmt_span(start: float, end: float) -> str:
    return f"{_fmt_t(start)}–{_fmt_t(end)}s"


def script_requirement_beat_ranges(total: int) -> str:
    """Comma-separated beat windows for the Requirements list (e.g. `0–2s, 2–5s, ...`)."""
    return ", ".join(_fmt_span(a, b) for a, b, _ in _beat_plan(total))


def script_output_format_block(total: int) -> str:
    """MANDATORY script template for the LLM; beat windows match `total` (VIDEO_SECONDS)."""
    beats = _beat_plan(total)
    t_end = dialogue_end_seconds(total)
    b4s, _, _ = beats[3]
    speech_inner = round(max(0.1, total - AUDIO_START_GUARD - AUDIO_END_GUARD), 2)
    word_cap = max(6, int(28 * total / 12))

    beat_lines = []
    for i, (a, b, label) in enumerate(beats, start=1):
        beat_lines.append(f"## Beat {i} — {_fmt_span(a, b)} ({label})")
        if i == 1:
            beat_lines.extend(
                [
                    "- What we see: (subjects, environment, product visibility — be specific)",
                    "- Camera move: (e.g. handheld close-up, slow push-in, whip pan)",
                    "- Lighting: (time of day, key mood, practicals)",
                    "- Action: (what moves, gestures, reactions; first ~0.5s of the **full clip** may be silent performance / reaction only)",
                    '- Line (approx. word count): (if spoken, the first ~0.5s of the **full clip** must remain "none — ambient only"; place any line in the remainder of Beat 1 only)',
                ]
            )
        elif i == 4:
            beat_lines.extend(
                [
                    "- What we see:",
                    "- Camera move:",
                    "- Lighting:",
                    f"- Action: ({_fmt_t(b4s)}–~{_fmt_t(t_end)}s may include performance tied to the last line; ~{_fmt_t(t_end)}–{_fmt_t(total)}s should be product hero, smile, pack shot, or gesture with no new speech)",
                    f'- Line (approx. word count): (any final spoken line must complete before ~{_fmt_t(t_end)}s; use "none — ambient only" for ~{_fmt_t(t_end)}–{_fmt_t(total)}s — never script dialogue that runs against the final frame boundary)',
                ]
            )
        else:
            beat_lines.extend(
                [
                    "- What we see:",
                    "- Camera move:",
                    "- Lighting:",
                    "- Action:",
                    "- Line (approx. word count):",
                ]
            )

    beats_body = "\n\n".join(beat_lines)

    return f"""MANDATORY OUTPUT FORMAT — your entire reply MUST follow this template. The video generator reads this literally; vague prose will fail. Time ranges must partition 0–{_fmt_t(float(total))}s with no gaps and no overlap (total {float(total)} seconds).

Audio-safe timeline (critical): Spoken dialogue must only occur between ~{AUDIO_START_GUARD}s and ~{_fmt_t(t_end)}s. Use 0–{AUDIO_START_GUARD}s for hook visuals with ambient/music/room tone only (no words). Use ~{_fmt_t(t_end)}–{_fmt_t(total)}s for product moment visuals with ambience or music tail only — the final spoken line must fully complete before ~{_fmt_t(t_end)}s with a tiny natural pause after, so nothing is clipped at export.

## Overview (2–4 sentences max)
Premise, tone, and single clear comedic or emotional idea. State the chosen creator-native format (e.g. POV, reaction, day-in-the-life). Do not read campaign bullets aloud.

{beats_body}

Rules for beats: Each beat's action and visuals must be producible in that time window. Sum of dialogue across all beats must fit comfortably within the dialogue window (~{speech_inner}s of speech time inside {total}s) (aim for ~{word_cap} spoken words max total unless pacing is very fast — leave air at start and end). The first frame may emphasize the product; after Beat 1, move into story per the brief. No readable on-screen words, stickers, burned-in captions, lower-thirds, or typography gags — only picture and sound; "caption-style" humor must be spoken or acted, not written in-frame."""

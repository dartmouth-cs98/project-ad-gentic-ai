"""Unit tests for Sora vs Veo provider selection from ad scripts."""

import sys
from pathlib import Path

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

from workers.ad_video_generation_worker.provider_selection import choose_video_provider

_DIALOGUE_SCRIPT = """
## Overview
Storytime to camera — relatable morning routine with direct address.

## Beat 1 — 0–2s (hook)
- What we see: creator in kitchen
- Camera move: handheld close-up
- Lighting: morning window
- Action: reacts to alarm
- Line (approx. word count): I used to hate mornings until this changed everything.

## Beat 2 — 2–5s (setup)
- What we see: same creator
- Camera move: slow push-in
- Lighting: warm
- Action: pours drink
- Line (approx. word count): Now I actually look forward to the first sip.

## Beat 3 — 5–9s (payoff)
- What we see: product on counter
- Camera move: medium shot
- Lighting: soft
- Action: smiles at camera
- Line (approx. word count): It's not magic, it's just really good coffee.

## Beat 4 — 9–12s (product moment)
- What we see: pack shot
- Camera move: static hero
- Lighting: clean
- Action: holds bag
- Line (approx. word count): none — ambient only
"""

_CINEMATIC_SCRIPT = """
## Overview
Silent visual montage with kinetic camera work — no talking head.

## Beat 1 — 0–2s (hook)
- What we see: city skyline at dawn
- Camera move: drone aerial descending into alley, whip pan into window
- Lighting: blue hour
- Action: light flicks on
- Line (approx. word count): none — ambient only

## Beat 2 — 2–5s (setup)
- What we see: product on marble
- Camera move: macro push with slow motion pour
- Lighting: rim light
- Action: liquid swirl
- Line (approx. word count): none — ambient only

## Beat 3 — 5–9s (payoff)
- What we see: hands only
- Camera move: steadicam orbit around bottle
- Lighting: high contrast
- Action: cap twists
- Line (approx. word count): none — ambient only

## Beat 4 — 9–12s (product moment)
- What we see: hero pack
- Camera move: crane up reveal
- Lighting: sparkle
- Action: mist in backlight
- Line (approx. word count): none — ambient only
"""


def test_choose_video_provider_prefers_veo_for_dialogue_heavy_script():
    assert choose_video_provider(_DIALOGUE_SCRIPT) == "veo"


def test_choose_video_provider_prefers_sora_for_cinematic_silent_script():
    assert choose_video_provider(_CINEMATIC_SCRIPT) == "sora"


def test_choose_video_provider_defaults_sora_for_empty_script():
    assert choose_video_provider("") == "sora"
    assert choose_video_provider("   ") == "sora"

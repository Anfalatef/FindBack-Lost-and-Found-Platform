"""Optional image intelligence for FindBack Vision.

The module deliberately keeps the vision dependency optional. The existing
text matcher continues to work when Pillow or sentence-transformers is not
installed, when the model cannot be downloaded, or when an image is invalid.
"""

from __future__ import annotations

import importlib.util
import json
import math
from pathlib import Path
from threading import Lock
from typing import Any


MODEL_NAME = "clip-ViT-B-32"

_model: Any | None = None
_model_error: str | None = None
_model_lock = Lock()


def dependencies_installed() -> bool:
    """Return whether the optional local vision packages are installed."""

    return (
        importlib.util.find_spec("PIL") is not None
        and importlib.util.find_spec("sentence_transformers") is not None
    )


def _get_model() -> Any | None:
    global _model, _model_error

    if _model is not None:
        return _model

    if _model_error is not None or not dependencies_installed():
        return None

    with _model_lock:
        if _model is not None:
            return _model

        try:
            from sentence_transformers import SentenceTransformer

            _model = SentenceTransformer(MODEL_NAME)
        except Exception as exc:  # Vision must never stop the core API.
            _model_error = f"{type(exc).__name__}: {exc}"
            return None

    return _model


def create_image_embedding(image_path: Path) -> str | None:
    """Create a normalized CLIP embedding and serialize it for the database."""

    model = _get_model()
    if model is None or not image_path.is_file():
        return None

    try:
        from PIL import Image

        with Image.open(image_path) as image:
            rgb_image = image.convert("RGB")
            vector = model.encode(
                rgb_image,
                normalize_embeddings=True,
                show_progress_bar=False
            )

        values = [round(float(value), 8) for value in vector.tolist()]
        return json.dumps(values, separators=(",", ":"))
    except Exception:
        return None


def _parse_embedding(value: str | None) -> list[float] | None:
    if not value:
        return None

    try:
        vector = [float(item) for item in json.loads(value)]
    except (TypeError, ValueError, json.JSONDecodeError):
        return None

    return vector or None


def compare_image_embeddings(
    first: str | None,
    second: str | None
) -> int | None:
    """Return cosine similarity as a safe 0-100 visual score."""

    first_vector = _parse_embedding(first)
    second_vector = _parse_embedding(second)

    if (
        first_vector is None
        or second_vector is None
        or len(first_vector) != len(second_vector)
    ):
        return None

    dot_product = sum(
        left * right
        for left, right in zip(first_vector, second_vector)
    )
    first_norm = math.sqrt(sum(value * value for value in first_vector))
    second_norm = math.sqrt(sum(value * value for value in second_vector))

    if first_norm == 0 or second_norm == 0:
        return None

    cosine_similarity = dot_product / (first_norm * second_norm)
    return round(max(0.0, min(1.0, cosine_similarity)) * 100)


def runtime_status() -> dict[str, str | bool | None]:
    """Expose a small diagnostic without loading the model eagerly."""

    installed = dependencies_installed()
    return {
        "feature": "FindBack Vision",
        "dependencies_installed": installed,
        "model_name": MODEL_NAME,
        "model_loaded": _model is not None,
        "last_error": _model_error,
        "fallback": "text_matching"
    }

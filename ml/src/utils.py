from __future__ import annotations

import json
import re
from typing import Iterable

from config import CATEGORY_SIGNALS

STOP_PHRASES = (
    "contains",
    "may contain",
    "allergen",
    "allergens",
    "warning",
    "distributed by",
    "imported by",
    "nutrition",
    "product description",
    "how to use",
    "directions",
    "usage",
    "customer care",
    "best before",
)


def normalize_text(value: str) -> str:
    cleaned = value.lower()
    cleaned = re.sub(r"ingredients?\s*:\s*", " ", cleaned)
    cleaned = re.sub(r"\((?:e\d+[a-z]?|ci\s*\d+|ins\s*\d+)\)", " ", cleaned)
    cleaned = re.sub(r"\[[^\]]*\]", " ", cleaned)
    cleaned = re.sub(r"\b\d+(?:\.\d+)?\s*(%|mg|mcg|g|kg|ml|l)\b", " ", cleaned)
    cleaned = re.sub(r"[^a-z0-9\s-]", " ", cleaned)
    cleaned = re.sub(r"(^|\s)-+", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def looks_like_ingredient(value: str) -> bool:
    if len(value) < 3 or len(value) > 80:
        return False
    if any(phrase in value for phrase in STOP_PHRASES):
        return False
    if len(value.split()) > 8:
        return False
    if re.search(r"\b(vitamin|mineral|daily value|serving|calorie|product|description)\b", value):
        return False
    if re.fullmatch(r"[a-z]-?\d{1,4}", value):
        return False
    if value[0].isdigit() and sum(character.isdigit() for character in value) >= max(3, len(value) // 3):
        return False
    if re.search(r"\b\d{5,}\b", value):
        return False
    if value.count("-") > 3:
        return False
    return True


def split_ingredients(text: str) -> list[str]:
    if not text:
        return []

    candidates = [normalize_text(item) for item in re.split(r"[,.;\n]+", text)]
    return [part for part in candidates if part and looks_like_ingredient(part)]


def infer_labels(ingredient: str) -> list[str]:
    labels: list[str] = []
    for category, signals in CATEGORY_SIGNALS.items():
        for signal in signals:
            pattern = rf"\b{re.escape(signal)}\b"
            if re.search(pattern, ingredient):
                labels.append(category)
                break
    return labels


def write_jsonl(path: str, rows: Iterable[dict]) -> None:
    with open(path, "w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=True) + "\n")

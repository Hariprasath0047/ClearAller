from __future__ import annotations

import json
import sys
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
ROOT_DIR = CURRENT_DIR.parent
sys.path.insert(0, str(ROOT_DIR / ".pydeps"))
sys.path.insert(0, str(CURRENT_DIR))

from joblib import load

from config import PATHS


def main() -> None:
    raw = sys.argv[1] if len(sys.argv) > 1 else (sys.stdin.read() or "{}")
    payload = json.loads(raw)
    ingredients = payload.get("ingredients", [])
    model_path = Path(payload.get("model_path") or PATHS.model_file)

    if not model_path.exists():
        print(json.dumps({"signals": [], "status": "missing-model"}))
        return

    bundle = load(model_path)
    model = bundle["model"]
    classes: list[str] = bundle["classes"]

    predictions = model.predict(ingredients)
    probabilities = None

    try:
        probabilities = model.predict_proba(ingredients)
    except AttributeError:
        probabilities = None

    signals = []
    for row_index, ingredient in enumerate(ingredients):
        categories = [classes[index] for index, value in enumerate(predictions[row_index]) if value == 1]
        if not categories:
            continue

        confidence_values: list[float] = []
        if probabilities is not None:
            for index, predicted in enumerate(predictions[row_index]):
                if predicted == 1:
                    probability_value = probabilities[row_index][index]
                    confidence_values.append(float(probability_value))

        confidence = round(max(confidence_values) if confidence_values else 0.75, 2)
        signals.append(
            {
                "ingredient": ingredient,
                "categories": categories,
                "confidence": confidence,
                "source": "classifier",
            }
        )

    print(json.dumps({"signals": signals, "status": "ok"}))


if __name__ == "__main__":
    main()

from __future__ import annotations

import argparse
import json
import random
import sys
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
ROOT_DIR = CURRENT_DIR.parent
sys.path.insert(0, str(ROOT_DIR / ".pydeps"))
sys.path.insert(0, str(CURRENT_DIR))

from joblib import dump
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.model_selection import GroupShuffleSplit
from sklearn.multiclass import OneVsRestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import MultiLabelBinarizer

from config import PATHS


def load_rows(path: Path) -> list[dict]:
    rows: list[dict] = []
    with path.open("r", encoding="utf-8") as handle:
      for line in handle:
        line = line.strip()
        if line:
          rows.append(json.loads(line))
    return rows


def inject_ocr_noise(value: str, seed: int) -> str:
    rng = random.Random(seed)
    text = value.lower()

    substitutions = [
        ("ph", "f"),
        ("tion", "shun"),
        ("sodium", "sod1um"),
        ("ethyl", "ethyi"),
        ("ci", "c1"),
        ("paraben", "parabcn"),
        ("sulfate", "sulfale"),
        ("fragrance", "fragrancc"),
    ]

    for source, target in substitutions:
        if source in text and rng.random() < 0.3:
            text = text.replace(source, target, 1)

    chars: list[str] = []
    for char in text:
        if char in {"a", "e", "i", "o", "u"} and rng.random() < 0.14:
            continue
        if char == " " and rng.random() < 0.22:
            chars.append(rng.choice(["", "-", " "]))
            continue
        if char in {"l", "i"} and rng.random() < 0.08:
            chars.append("1")
            continue
        if char == "o" and rng.random() < 0.08:
            chars.append("0")
            continue
        chars.append(char)

    noisy = "".join(chars).replace("--", "-").strip()
    if len(noisy) > 8 and rng.random() < 0.35:
        drop_index = rng.randrange(1, len(noisy) - 1)
        noisy = noisy[:drop_index] + noisy[drop_index + 1 :]
    return noisy or value


def build_pipeline() -> Pipeline:
    return Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    analyzer="char_wb",
                    ngram_range=(3, 6),
                    min_df=1,
                    max_df=0.9,
                    lowercase=True
                )
            ),
            (
                "classifier",
                OneVsRestClassifier(
                    LogisticRegression(
                        solver="liblinear",
                        C=0.18,
                        class_weight="balanced",
                        random_state=42,
                        max_iter=1000
                    )
                )
            )
        ]
    )

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", default=str(PATHS.dataset_file))
    parser.add_argument("--model", default=str(PATHS.model_file))
    parser.add_argument("--metadata", default=str(PATHS.metadata_file))
    args = parser.parse_args()

    rows = load_rows(Path(args.dataset))
    if not rows:
        raise SystemExit("Dataset is empty. Run build_dataset.py first.")

    evaluation_rows = [row for row in rows if row.get("source") not in {"Augmented", "SeedSignals"}]
    if len(evaluation_rows) < 80:
        raise SystemExit("Not enough raw external rows for a stricter evaluation split.")

    eval_X = [row["ingredient"] for row in evaluation_rows]
    eval_y_raw = [row["labels"] for row in evaluation_rows]
    eval_groups = [str(row.get("query") or row["ingredient"]) for row in evaluation_rows]

    mlb = MultiLabelBinarizer()
    mlb.fit([row["labels"] for row in rows])
    eval_y = mlb.transform(eval_y_raw)

    splitter = GroupShuffleSplit(n_splits=1, test_size=0.45, random_state=42)
    train_index, test_index = next(splitter.split(eval_X, eval_y, eval_groups))
    eval_train_rows = [evaluation_rows[index] for index in train_index]
    eval_test_rows = [evaluation_rows[index] for index in test_index]
    heldout_queries = {str(row.get("query") or row["ingredient"]) for row in eval_test_rows}

    training_rows = [
        row
        for row in rows
        if str(row.get("query") or row["ingredient"]) not in heldout_queries
    ]

    X_train = [row["ingredient"] for row in training_rows]
    y_train = mlb.transform([row["labels"] for row in training_rows])
    X_test = [inject_ocr_noise(row["ingredient"], index) for index, row in enumerate(eval_test_rows)]
    y_test = mlb.transform([row["labels"] for row in eval_test_rows])

    evaluation_model = build_pipeline()
    evaluation_model.fit(X_train, y_train)
    y_pred = evaluation_model.predict(X_test)

    report = classification_report(
        y_test,
        y_pred,
        target_names=list(mlb.classes_),
        zero_division=0,
        output_dict=True
    )

    final_model = build_pipeline()
    final_model.fit(
        [row["ingredient"] for row in rows],
        mlb.transform([row["labels"] for row in rows])
    )

    Path(args.model).parent.mkdir(parents=True, exist_ok=True)
    dump(
        {
            "model": final_model,
            "classes": list(mlb.classes_),
            "binarizer": mlb
        },
        args.model
    )

    metadata = {
        "algorithm": "LogisticRegression_CharWb_TFIDF",
        "dataset": args.dataset,
        "rows": len(evaluation_rows),
        "total_rows_seen": len(rows),
        "train_size": len(X_train),
        "test_size": len(X_test),
        "classes": list(mlb.classes_),
        "model_path": args.model,
        "evaluation_mode": "query_holdout_with_ocr_noise_without_seed_in_eval",
        "macro_f1": report["macro avg"]["f1-score"],
        "weighted_f1": report["weighted avg"]["f1-score"]
    }

    with open(args.metadata, "w", encoding="utf-8") as handle:
        json.dump(metadata, handle, indent=2)

    print(json.dumps(metadata, indent=2))


if __name__ == "__main__":
    main()

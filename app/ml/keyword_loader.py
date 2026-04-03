from pathlib import Path

def load_keywords(base_path):
    category_map = {}

    for file in Path(base_path).glob("*.txt"):
        category = file.stem

        with open(file, "r") as f:
            words = [line.strip().lower() for line in f if line.strip()]

        category_map[category] = words

    return category_map
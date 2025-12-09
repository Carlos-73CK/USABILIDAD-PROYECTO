import json
import os
import threading
from datetime import datetime
from typing import Any, Dict, List
from uuid import uuid4


_LOCK = threading.Lock()


def _storage_path() -> str:
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
    os.makedirs(base_dir, exist_ok=True)
    return os.path.join(base_dir, "history.json")


def _read_all() -> List[Dict[str, Any]]:
    path = _storage_path()
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            return []
    except Exception:
        # Corrupted or unreadable file; start fresh but do not crash API
        return []


def _write_all(items: List[Dict[str, Any]]) -> None:
    path = _storage_path()
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)


def add_record(input_symptoms: List[str], result: Any, user_id: str | None = None) -> Dict[str, Any]:
    now = datetime.utcnow().isoformat() + "Z"
    record = {
        "id": str(uuid4()),
        "user_id": user_id,
        "input_symptoms": input_symptoms,
        "result": result,
        "created_at": now,
    }
    with _LOCK:
        items = _read_all()
        items.insert(0, record)  # newest first
        # keep only last 200 to avoid unbounded growth
        items = items[:200]
        _write_all(items)
    return record


def list_records(limit: int = 50) -> List[Dict[str, Any]]:
    with _LOCK:
        items = _read_all()
        return items[:limit]


def delete_record(rec_id: str) -> bool:
    with _LOCK:
        items = _read_all()
        new_items = [it for it in items if it.get("id") != rec_id]
        if len(new_items) == len(items):
            return False
        _write_all(new_items)
        return True

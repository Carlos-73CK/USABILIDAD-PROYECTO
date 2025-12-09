from fastapi.testclient import TestClient
from app.main import app


def test_diagnose_basic():
    client = TestClient(app)
    payload = {"symptoms": ["fiebre", "tos"]}
    r = client.post("/diagnose", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "disclaimer" in data
    assert isinstance(data["diagnoses"], list)
    assert len(data["diagnoses"]) >= 1

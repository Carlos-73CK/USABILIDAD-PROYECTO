from typing import Dict, List, Tuple
from ..schemas import Diagnosis


# Conjunto local de conocimiento simple: condiciones con síntomas y pesos.
# Suma de pesos para síntomas presentes => score. Se normaliza a [0,1].
S_DOLOR_CABEZA = "dolor de cabeza"

KB: Dict[str, Dict[str, float]] = {
    # Infecciones respiratorias
    "Resfriado": {
        "tos": 0.35,
        "congestion": 0.30,
        "goteo nasal": 0.25,
        "dolor de garganta": 0.25,
        "estornudos": 0.20,
        "fiebre": 0.15,
        "malestar": 0.20,
    },
    "Gripe": {
        "fiebre": 0.45,
        "escalofrios": 0.25,
        "dolor muscular": 0.30,
        "tos": 0.25,
        "cansancio": 0.30,
    S_DOLOR_CABEZA: 0.25,
    },
    "COVID-19": {
        "fiebre": 0.35,
        "tos": 0.35,
        "falta de aire": 0.35,
        "perdida de olfato": 0.40,
        "perdida de gusto": 0.40,
        "dolor de garganta": 0.20,
        "dolor muscular": 0.20,
    },
    # Cefaleas
    "Migraña": {
    S_DOLOR_CABEZA: 0.5,
        "nauseas": 0.3,
        "fotofobia": 0.35,
        "fonofobia": 0.25,
        "aura": 0.30,
    },
    "Cefalea tensional": {
    S_DOLOR_CABEZA: 0.45,
        "estres": 0.30,
        "tension cuello": 0.30,
        "postura": 0.20,
    },
    # Gastro
    "Gastroenteritis": {
        "nauseas": 0.35,
        "vomitos": 0.40,
        "diarrea": 0.45,
        "dolor abdominal": 0.35,
        "fiebre": 0.20,
    },
}

# Diccionario de sinónimos para normalizar entrada coloquial
SYNONYMS = {
    # Cabeza
    "cabeza": S_DOLOR_CABEZA,
    "jaqueca": S_DOLOR_CABEZA,
    "cefalea": S_DOLOR_CABEZA,
    # Fiebre
    "calentura": "fiebre",
    "temperatura": "fiebre",
    "febrícula": "fiebre",
    # Respiratorio
    "moco": "goteo nasal",
    "mocos": "goteo nasal",
    "nariz tapada": "congestion",
    "taponada": "congestion",
    "garganta": "dolor de garganta",
    "tragar": "dolor de garganta",
    "aire": "falta de aire",
    "ahogo": "falta de aire",
    "disnea": "falta de aire",
    # Gastro
    "panza": "dolor abdominal",
    "estomago": "dolor abdominal",
    "barriga": "dolor abdominal",
    "tripa": "dolor abdominal",
    "vomito": "vomitos",
    "devolver": "vomitos",
    "suelto": "diarrea",
    "cagarrinas": "diarrea",
    # General
    "cuerpo cortado": "malestar",
    "mal cuerpo": "malestar",
    "cansado": "cansancio",
    "fatiga": "cansancio",
    "agotado": "cansancio",
    "frio": "escalofrios",
    "tiritona": "escalofrios",
}

RECS: Dict[str, str] = {
    "Resfriado": "Hidratación, descanso, analgésicos/antitérmicos si procede.",
    "Gripe": "Reposo, hidratación; consultar si fiebre alta o dificultad respiratoria.",
    "COVID-19": "Prueba diagnóstica, aislamiento, mascarilla; consultar ante empeoramiento.",
    "Migraña": "Descanso en lugar oscuro, hidratación, medicación pautada si la hay.",
    "Cefalea tensional": "Higiene postural, pausas activas, técnicas de relajación.",
    "Gastroenteritis": "Hidratación oral fraccionada, dieta blanda; vigilar signos de deshidratación.",
}


def _normalize_symptom(s: str) -> str:
    norm = s.lower().strip()
    # Buscar coincidencia parcial o exacta en sinónimos
    for key, val in SYNONYMS.items():
        if key in norm:
            return val
    return norm


def _score_condition(sym_set: set[str], cond_sym_weights: Dict[str, float]) -> float:
    score = 0.0
    max_score = sum(cond_sym_weights.values()) or 1.0
    for s, w in cond_sym_weights.items():
        if s in sym_set:
            score += w
    return max(0.0, min(1.0, score / max_score))


def suggest_diagnoses(symptoms: List[str]) -> List[Diagnosis]:
    normalized = {_normalize_symptom(s) for s in symptoms if s and s.strip()}
    scored: List[Tuple[str, float]] = []
    for cond, weights in KB.items():
        conf = _score_condition(normalized, weights)
        if conf > 0:
            scored.append((cond, conf))

    scored.sort(key=lambda x: x[1], reverse=True)
    top = scored[:3]

    if not top:
        return [
            Diagnosis(
                condition="Indeterminado",
                confidence=0.2,
                recommendation=(
                    "Si los síntomas persisten o empeoran, consulte a un profesional de salud."
                ),
            )
        ]

    results: List[Diagnosis] = []
    for cond, conf in top:
        rec = RECS.get(cond, "Consulte a un profesional de salud si empeora.")
        results.append(Diagnosis(condition=cond, confidence=round(conf, 2), recommendation=rec))
    return results

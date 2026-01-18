from typing import Dict, List, Tuple
import json
from pathlib import Path
import numpy as np
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from ..schemas import Diagnosis

# --- BASE DE CONOCIMIENTO (KNOWLEDGE BASE) ---
# Definimos constantes para síntomas comunes para evitar errores de dedo
S_DOLOR_CABEZA = "dolor de cabeza"
S_FIEBRE = "fiebre"
S_TOS = "tos"
S_DOLOR_ESTOMAGO = "dolor de estomago"

# La base de conocimiento se carga desde múltiples JSON en `ai_data/*.json`.
# Dejamos estos dicts como fallback (mínimo) por si faltan los archivos.
KB: Dict[str, Dict[str, float]] = {}
RECS: Dict[str, str] = {}


def _load_kb_from_json_files() -> Tuple[Dict[str, Dict[str, float]], Dict[str, str]]:
    """Carga diagnósticos desde `ai_data/*.json`.

    Estructura esperada por archivo:
    {
      "diagnoses": {
        "Nombre": {"symptoms": {"sintoma": 0.3}, "recommendation": "..."}
      }
    }
    """
    data_dir = Path(__file__).with_name("ai_data")
    if not data_dir.exists() or not data_dir.is_dir():
        return {}, {}

    merged_kb: Dict[str, Dict[str, float]] = {}
    merged_recs: Dict[str, str] = {}

    for path in sorted(data_dir.glob("*.json")):
        # Permite tener archivos de ejemplo/documentación
        if path.name.endswith(".example.json"):
            continue

        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:
            raise ValueError(f"No se pudo leer JSON: {path.name}. Error: {exc}") from exc

        diagnoses = payload.get("diagnoses")
        if not isinstance(diagnoses, dict):
            raise ValueError(f"Formato inválido en {path.name}: falta 'diagnoses' (dict).")

        for diagnosis_name, diagnosis_data in diagnoses.items():
            if not isinstance(diagnosis_name, str) or not diagnosis_name.strip():
                raise ValueError(f"Formato inválido en {path.name}: nombre de diagnóstico vacío.")
            if not isinstance(diagnosis_data, dict):
                raise ValueError(f"Formato inválido en {path.name}: '{diagnosis_name}' debe ser objeto.")

            symptoms = diagnosis_data.get("symptoms")
            recommendation = diagnosis_data.get("recommendation")

            if not isinstance(symptoms, dict) or not symptoms:
                raise ValueError(f"Formato inválido en {path.name}: '{diagnosis_name}.symptoms' debe ser dict no vacío.")
            if not isinstance(recommendation, str) or not recommendation.strip():
                raise ValueError(f"Formato inválido en {path.name}: '{diagnosis_name}.recommendation' debe ser string.")

            # Normalizamos: lower + trim
            normalized_symptoms: Dict[str, float] = {}
            for symptom_name, weight in symptoms.items():
                if not isinstance(symptom_name, str) or not symptom_name.strip():
                    raise ValueError(f"Formato inválido en {path.name}: síntoma vacío en '{diagnosis_name}'.")
                if not isinstance(weight, (int, float)):
                    raise ValueError(f"Formato inválido en {path.name}: peso no numérico para '{diagnosis_name}.{symptom_name}'.")
                if weight < 0:
                    raise ValueError(f"Formato inválido en {path.name}: peso negativo para '{diagnosis_name}.{symptom_name}'.")
                normalized_symptoms[symptom_name.strip().lower()] = float(weight)

            diagnosis_key = diagnosis_name.strip()
            if diagnosis_key in merged_kb or diagnosis_key in merged_recs:
                raise ValueError(
                    f"Diagnóstico duplicado '{diagnosis_key}' al cargar {path.name}. "
                    "Renómbralo o déjalo solo en un archivo."
                )

            merged_kb[diagnosis_key] = normalized_symptoms
            merged_recs[diagnosis_key] = recommendation.strip()

    return merged_kb, merged_recs


# Preferimos datasets externos (JSON) si existen; si no, usamos los diccionarios embebidos.
_json_kb, _json_recs = _load_kb_from_json_files()
if _json_kb and _json_recs:
    KB = _json_kb
    RECS = _json_recs
else:
    # Fallback mínimo (solo si no hay datasets JSON cargados)
    KB = {
        "Resfriado Común": {
            "tos": 0.30,
            "congestion nasal": 0.30,
            "dolor de garganta": 0.25,
            "estornudos": 0.20,
            "fiebre": 0.10,
        },
        "Migraña": {
            "dolor de cabeza": 0.50,
            "nauseas": 0.30,
            "sensibilidad a la luz": 0.35,
        },
        "Gastroenteritis": {
            "vomitos": 0.40,
            "diarrea": 0.45,
            "dolor abdominal": 0.35,
            "fiebre": 0.20,
        },
    }
    RECS = {
        "Resfriado Común": "Hidratación constante, descanso y analgésicos de venta libre si es necesario.",
        "Migraña": "Descanso en habitación oscura y silenciosa. Tome su medicación prescrita si la tiene.",
        "Gastroenteritis": "Dieta blanda y suero oral para evitar deshidratación. Evite lácteos.",
    }

# --- LÓGICA DE IA (NLP) ---

# Diccionario de sinónimos para normalizar lenguaje coloquial
SYNONYMS = {
    # Cabeza
    "jaqueca": S_DOLOR_CABEZA, "cefalea": S_DOLOR_CABEZA, "coco": S_DOLOR_CABEZA,
    # Estomago
    "panza": "dolor abdominal", "barriga": "dolor abdominal", "tripa": "dolor abdominal", "estomago": "dolor abdominal",
    "ardor": "ardor de estomago", "acidez": "ardor de estomago", "reflujo": "ardor de estomago",
    "boca": "dolor en boca del estomago",
    # Vomito
    "devolver": "vomitos", "guacara": "vomitos", "arqueada": "vomitos", "vomito": "vomitos",
    # Fiebre
    "calentura": S_FIEBRE, "temperatura": S_FIEBRE, "ardiendo": S_FIEBRE, "febrícula": S_FIEBRE,
    # Cansancio
    "fatiga": "fatiga extrema", "agotamiento": "fatiga extrema", "sueño": "fatiga extrema", "debilidad": "fatiga extrema", "cansado": "fatiga extrema",
    "debil": "fatiga extrema", "devil": "fatiga extrema", "sin fuerzas": "fatiga extrema", "bajon": "fatiga extrema",
    # Respirar
    "aire": "dificultad para respirar", "ahogo": "dificultad para respirar", "asfixia": "dificultad para respirar", "disnea": "dificultad para respirar",
    "pecho": "dolor de pecho", "opresion": "opresion en el pecho", "opresión": "opresion en el pecho",
    "silbido": "silbidos al respirar", "silbidos": "silbidos al respirar", "sibilancias": "silbidos al respirar",
    # Piel
    "ronchas": "erupcion cutanea", "granos": "erupcion cutanea", "sarpullido": "erupcion cutanea", "pica": "picazon en piel", "comezon": "picazon en piel",
    # Ojos
    "lagaña": "lagañas", "rojo": "ojo rojo",
    # ORL
    "tragar": "dificultad para tragar", "pasar": "dificultad para tragar", "garganta": "dolor de garganta",
    "oido": "dolor de oido", "oreja": "dolor de oido", "zumbido": "dolor de oido",
    "moco": "congestion nasal", "tupido": "congestion nasal", "constipado": "congestion nasal",
    "voz": "perdida de voz", "afonia": "perdida de voz", "afonía": "perdida de voz", "ronco": "ronquera", "ronca": "ronquera",
    "nariz": "congestion nasal", "moqueo": "goteo nasal", "lagrimeo": "lagrimeo",
    # Muscular
    "espalda": "dolor de espalda", "cintura": "dolor lumbar", "lumbago": "dolor lumbar", "riñones": "dolor lumbar",
    "tieso": "rigidez muscular", "duro": "rigidez muscular",
    # General
    "sed": "sed excesiva", "seca": "boca seca", "seco": "boca seca",
    "palido": "palidez", "blanco": "palidez", "amarillo": "palidez",
    "frio": "frio", "helado": "frio",
    "sudor": "sudoracion excesiva", "sudando": "sudoracion excesiva",
    "confuso": "confusion", "confusa": "confusion",
    "giro": "sensacion de giro", "girando": "sensacion de giro",
    "hinchado": "hinchazon", "hinchada": "hinchazon", "inflamado": "hinchazon", "inflamada": "hinchazon",

    # Digestivo (reflujo)
    "regurgito": "regurgitacion", "regurgitacion": "regurgitacion", "regurgitación": "regurgitacion",
    "amargo": "sabor amargo",

    # Urinario
    "orinar": "orinar frecuente", "pipi": "orinar frecuente", "pipí": "orinar frecuente", "baño": "orinar frecuente",
    "arde": "ardor al orinar",
    "urgencia": "urgencia urinaria",
    "vientre": "dolor bajo vientre",
    "costado": "dolor en costado", "ingle": "dolor que baja a la ingle",
    "sangre": "orina con sangre",
    # Digestivo
    "estrenimiento": "estrenimiento", "estreñimiento": "estrenimiento", "estrenida": "estrenimiento", "estreñida": "estrenimiento",
    # Sueño
    "dormir": "dificultad para dormir", "despierto": "despertar nocturno", "desvelo": "dificultad para dormir"
}

# Palabras vacías en español para filtrar ruido
STOPWORDS = {
    "el", "la", "los", "las", "un", "una", "unos", "unas", "y", "o", "pero", "si", "no", "en", "de", "del", "al", "a", "con", "sin", "por", "para",
    "mi", "mis", "tu", "tus", "su", "sus", "me", "te", "se", "nos", "le", "les", "lo", "que", "cual", "quien", "donde", "cuando", "como",
    "tengo", "siento", "mucho", "mucha", "poco", "poca", "muy", "mas", "menos", "bastante", "demasiado", "todo", "nada", "algo", "es", "son", "esta", "estan"
}

def _get_all_known_symptoms() -> List[str]:
    """Extrae una lista única de todos los síntomas que el sistema conoce."""
    symptoms = set()
    for condition_data in KB.values():
        symptoms.update(condition_data.keys())
    return list(symptoms)

def _split_sentences(text_list: List[str]) -> List[str]:
    """Divide oraciones largas en fragmentos más pequeños basados en conectores comunes."""
    split_list = []
    separators = r'[,.;y\n]|\by\b|\bo\b|\bademas\b' # Coma, punto, 'y', 'o', 'ademas'
    
    for text in text_list:
        # Dividir por separadores
        parts = re.split(separators, text)
        # Limpiar espacios y filtrar vacíos
        clean_parts = [p.strip() for p in parts if p.strip()]
        split_list.extend(clean_parts)
        
    return split_list

def _normalize_text(text: str) -> str:
    """Aplica sinónimos y elimina stopwords."""
    words = text.lower().split()
    normalized_words = []
    
    for word in words:
        # 1. Reemplazo de sinónimos
        word = SYNONYMS.get(word, word)
        # 2. Filtrado de stopwords (solo si no es una palabra clave médica que coincida con stopword, raro pero posible)
        if word not in STOPWORDS:
            normalized_words.append(word)
            
    return " ".join(normalized_words)

def _is_negated(text: str) -> bool:
    """Detecta negaciones simples como 'no tengo', 'sin', etc."""
    negations = ["no ", "sin ", "nunca ", "jamás "]
    return any(text.startswith(neg) for neg in negations)

def _match_symptoms_with_ai(user_inputs: List[str], threshold: float = 0.15) -> List[str]:
    """
    Usa TF-IDF y Similitud de Coseno para encontrar qué síntomas conocidos
    se parecen más a lo que escribió el usuario.
    """
    known_symptoms = _get_all_known_symptoms()
    
    # Pre-procesamiento: Dividir oraciones largas
    raw_parts = _split_sentences(user_inputs)
    
    # Normalizar cada parte (sinónimos + stopwords)
    processed_inputs = []
    valid_indices = [] # Para rastrear qué input original corresponde a qué procesado
    
    for i, part in enumerate(raw_parts):
        if _is_negated(part):
            continue
        norm = _normalize_text(part)
        if norm:
            processed_inputs.append(norm)
            valid_indices.append(i)

    if not known_symptoms or not processed_inputs:
        return []

    # Creamos un "corpus" que incluye los síntomas conocidos
    # Entrenamos el vectorizador con nuestro vocabulario médico
    vectorizer = TfidfVectorizer(analyzer='char_wb', ngram_range=(2, 4)) 
    # Usamos char_wb (n-gramas de caracteres) para ser robustos ante errores ortográficos leves
    
    tfidf_matrix = vectorizer.fit_transform(known_symptoms + processed_inputs)
    
    # Separamos la matriz: Parte conocida vs Parte del usuario
    known_vectors = tfidf_matrix[:len(known_symptoms)]
    user_vectors = tfidf_matrix[len(known_symptoms):]

    detected_symptoms = set()

    # Calculamos similitud de cada entrada del usuario contra todos los síntomas conocidos
    similarity_matrix = cosine_similarity(user_vectors, known_vectors)

    for i, _ in enumerate(processed_inputs):
        # Obtenemos las similitudes para esta entrada específica
        sim_scores = similarity_matrix[i]
        
        # Indices ordenados por score descendente
        top_indices = np.argsort(sim_scores)[::-1][:2] 
        
        for idx in top_indices:
            score = sim_scores[idx]
            if score >= threshold:
                matched_symptom = known_symptoms[idx]
                detected_symptoms.add(matched_symptom)

    return list(detected_symptoms)

def _calculate_diagnosis_score(detected_symptoms: List[str]) -> List[Tuple[str, float, List[str]]]:
    """Calcula la probabilidad de cada enfermedad basada en los síntomas detectados."""
    scores = []
    
    for condition, weights in KB.items():
        current_score = 0.0
        max_possible_score = sum(weights.values()) # Normalización
        matched_for_condition = []

        for symptom in detected_symptoms:
            if symptom in weights:
                current_score += weights[symptom]
                matched_for_condition.append(symptom)
        
        # Calculamos porcentaje de coincidencia
        if max_possible_score > 0:
            probability = current_score / max_possible_score
        else:
            probability = 0.0
            
        if probability > 0:
            scores.append((condition, probability, matched_for_condition))
            
    return scores

def suggest_diagnoses(symptoms: List[str]) -> List[Diagnosis]:
    # 1. Limpieza básica
    clean_inputs = [s.strip().lower() for s in symptoms if s and s.strip()]
    
    if not clean_inputs:
        return []

    # 2. IA: Matching de síntomas usando NLP
    detected_symptoms = _match_symptoms_with_ai(clean_inputs)

    # 3. Sistema Experto: Cálculo de probabilidades
    scored_conditions = _calculate_diagnosis_score(detected_symptoms)

    # 4. Ordenar y formatear resultados
    scored_conditions.sort(key=lambda x: x[1], reverse=True)
    top_results = scored_conditions[:3]

    final_diagnoses = []
    for condition, prob, matches in top_results:
        base_rec = RECS.get(condition, "Consulte a un médico.")
        
        # Generamos una explicación clara
        match_str = ", ".join(matches)
        explanation = f"\n\n(Coincidencias detectadas: {match_str})"
        
        # Alertas de banderas rojas
        red_flags = [
            "dificultad para respirar",
            "dolor de pecho",
            "perdida de conciencia",
            "orina con sangre",
            "fiebre alta",
        ]
        is_urgent = any(rf in matches for rf in red_flags)
        
        prefix = "⚠️ ATENCIÓN MÉDICA RECOMENDADA. " if is_urgent else ""
        
        final_diagnoses.append(
            Diagnosis(
                condition=condition,
                confidence=round(prob, 2), # Redondear a 2 decimales (ej: 0.85)
                recommendation=f"{prefix}{base_rec}{explanation}"
            )
        )

    # Si no encontramos nada con confianza suficiente
    if not final_diagnoses:
        return [
            Diagnosis(
                condition="Sin diagnóstico claro",
                confidence=0.0,
                recommendation="Sus síntomas no coinciden claramente con nuestra base de datos. Por favor acuda a un centro de salud para una evaluación completa."
            )
        ]

    return final_diagnoses

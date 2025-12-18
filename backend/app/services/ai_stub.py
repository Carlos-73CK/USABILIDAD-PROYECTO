from typing import Dict, List, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from ..schemas import Diagnosis

# --- BASE DE CONOCIMIENTO (KNOWLEDGE BASE) ---
# Definimos constantes para síntomas comunes para evitar errores de dedo
S_DOLOR_CABEZA = "dolor de cabeza"
S_FIEBRE = "fiebre"
S_TOS = "tos"

KB: Dict[str, Dict[str, float]] = {
    # Infecciones respiratorias
    "Resfriado Común": {
        S_TOS: 0.30,
        "congestion nasal": 0.30,
        "goteo nasal": 0.25,
        "dolor de garganta": 0.25,
        "estornudos": 0.20,
        S_FIEBRE: 0.10, # Poco común
        "malestar general": 0.20,
    },
    "Gripe Estacional": {
        S_FIEBRE: 0.40,
        "escalofrios": 0.25,
        "dolor muscular": 0.30,
        S_TOS: 0.25,
        "fatiga extrema": 0.30,
        S_DOLOR_CABEZA: 0.25,
    },
    "COVID-19": {
        S_FIEBRE: 0.35,
        S_TOS: 0.35,
        "dificultad para respirar": 0.40,
        "perdida de olfato": 0.45, # Muy específico
        "perdida de gusto": 0.45,
        "dolor de garganta": 0.20,
        "dolor muscular": 0.20,
    },
    # Cefaleas
    "Migraña": {
        S_DOLOR_CABEZA: 0.50,
        "nauseas": 0.30,
        "sensibilidad a la luz": 0.35, # Fotofobia
        "sensibilidad al ruido": 0.25, # Fonofobia
        "vision borrosa o aura": 0.30,
    },
    "Cefalea Tensional": {
        S_DOLOR_CABEZA: 0.45,
        "estres o ansiedad": 0.30,
        "tension en el cuello": 0.35,
        "mala postura": 0.20,
    },
    # Gastrointestinal
    "Gastroenteritis": {
        "nauseas": 0.35,
        "vomitos": 0.40,
        "diarrea": 0.45,
        "dolor abdominal": 0.35,
        S_FIEBRE: 0.20,
    },
}

RECS: Dict[str, str] = {
    "Resfriado Común": "Hidratación constante, descanso y analgésicos de venta libre si es necesario.",
    "Gripe Estacional": "Reposo absoluto, mucha hidratación. Consulte al médico si la fiebre es muy alta.",
    "COVID-19": "Aislamiento preventivo, uso de mascarilla y monitoreo de oxígeno. Busque ayuda si falta el aire.",
    "Migraña": "Descanso en habitación oscura y silenciosa. Tome su medicación prescrita si la tiene.",
    "Cefalea Tensional": "Realice estiramientos de cuello, mejore su postura y tome pausas activas.",
    "Gastroenteritis": "Dieta blanda y suero oral para evitar deshidratación. Evite lácteos.",
}

# --- LÓGICA DE IA (NLP) ---

def _get_all_known_symptoms() -> List[str]:
    """Extrae una lista única de todos los síntomas que el sistema conoce."""
    symptoms = set()
    for condition_data in KB.values():
        symptoms.update(condition_data.keys())
    return list(symptoms)

def _match_symptoms_with_ai(user_inputs: List[str], threshold: float = 0.25) -> List[str]:
    """
    Usa TF-IDF y Similitud de Coseno para encontrar qué síntomas conocidos
    se parecen más a lo que escribió el usuario.
    """
    known_symptoms = _get_all_known_symptoms()
    if not known_symptoms or not user_inputs:
        return []

    # Creamos un "corpus" que incluye los síntomas conocidos
    # Entrenamos el vectorizador con nuestro vocabulario médico
    vectorizer = TfidfVectorizer(analyzer='char_wb', ngram_range=(2, 4)) 
    # Usamos char_wb (n-gramas de caracteres) para ser robustos ante errores ortográficos leves
    
    tfidf_matrix = vectorizer.fit_transform(known_symptoms + user_inputs)
    
    # Separamos la matriz: Parte conocida vs Parte del usuario
    known_vectors = tfidf_matrix[:len(known_symptoms)]
    user_vectors = tfidf_matrix[len(known_symptoms):]

    detected_symptoms = set()

    # Calculamos similitud de cada entrada del usuario contra todos los síntomas conocidos
    similarity_matrix = cosine_similarity(user_vectors, known_vectors)

    for i, user_input in enumerate(user_inputs):
        # Obtenemos las similitudes para esta entrada específica
        sim_scores = similarity_matrix[i]
        
        # Encontramos el mejor match
        best_match_idx = np.argmax(sim_scores)
        best_score = sim_scores[best_match_idx]

        if best_score >= threshold:
            matched_symptom = known_symptoms[best_match_idx]
            # print(f"DEBUG: '{user_input}' matcheó con '{matched_symptom}' (Score: {best_score:.2f})")
            detected_symptoms.add(matched_symptom)

    return list(detected_symptoms)

def _calculate_diagnosis_score(detected_symptoms: List[str]) -> List[Tuple[str, float]]:
    """Calcula la probabilidad de cada enfermedad basada en los síntomas detectados."""
    scores = []
    
    for condition, weights in KB.items():
        current_score = 0.0
        max_possible_score = sum(weights.values()) # Normalización
        
        for symptom in detected_symptoms:
            if symptom in weights:
                current_score += weights[symptom]
        
        # Calculamos porcentaje de coincidencia
        if max_possible_score > 0:
            probability = current_score / max_possible_score
        else:
            probability = 0.0
            
        if probability > 0:
            scores.append((condition, probability))
            
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
    for condition, prob in top_results:
        rec = RECS.get(condition, "Consulte a un médico.")
        final_diagnoses.append(
            Diagnosis(
                condition=condition,
                confidence=round(prob, 2), # Redondear a 2 decimales (ej: 0.85)
                recommendation=rec
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

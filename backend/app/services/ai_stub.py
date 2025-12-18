from typing import Dict, List, Tuple
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
    "Indigestión / Acidez": {
        "ardor de estomago": 0.40,
        "gases": 0.30,
        "sensacion de llenura": 0.30,
        "eructos": 0.20,
        "dolor abdominal": 0.20,
    },
    # Alergias
    "Alergia Estacional": {
        "estornudos": 0.35,
        "picazon en ojos": 0.30,
        "ojos llorosos": 0.30,
        "goteo nasal": 0.25,
        "congestion nasal": 0.20,
    },
    # Salud Mental (Básico)
    "Ansiedad Generalizada": {
        "palpitaciones": 0.30,
        "sensacion de ahogo": 0.30,
        "miedo irracional": 0.25,
        "sudoracion excesiva": 0.20,
        "temblores": 0.20,
        "insomnio": 0.20,
    },
    # Piel
    "Dermatitis / Eczema": {
        "picazon en piel": 0.40,
        "enrojecimiento": 0.30,
        "piel seca": 0.30,
        "erupcion cutanea": 0.30,
    },
    "Conjuntivitis": {
        "ojo rojo": 0.40,
        "picazon en ojos": 0.30,
        "lagañas": 0.30,
        "sensibilidad a la luz": 0.20,
    },
    # Oído, Nariz y Garganta (ORL)
    "Sinusitis": {
        "dolor facial": 0.40,
        "congestion nasal": 0.30,
        "moco verde": 0.30,
        S_DOLOR_CABEZA: 0.20,
        S_FIEBRE: 0.15,
    },
    "Faringitis / Amigdalitis": {
        "dolor de garganta": 0.50,
        "dificultad para tragar": 0.40,
        S_FIEBRE: 0.30,
        "placas en garganta": 0.30,
        "ganglios inflamados": 0.20,
    },
    "Otitis": {
        "dolor de oido": 0.50,
        S_FIEBRE: 0.25,
        "mareo": 0.20,
        "secrecion oido": 0.30,
    },
    # Muscular / Esquelético
    "Contractura / Lumbalgia": {
        "dolor de espalda": 0.45,
        "rigidez muscular": 0.35,
        "dolor al moverse": 0.30,
        "dolor lumbar": 0.40,
    },
    # Otros
    "Deshidratación": {
        "sed excesiva": 0.45,
        "boca seca": 0.40,
        "orina oscura": 0.35,
        "mareo": 0.30,
        "fatiga extrema": 0.25,
    },
    "Anemia": {
        "palidez": 0.40,
        "fatiga extrema": 0.40,
        "mareo": 0.30,
        "frio": 0.25,
        "debilidad": 0.30,
    },
    # Sueño
    "Insomnio": {
        "dificultad para dormir": 0.50,
        "despertar nocturno": 0.30,
        "cansancio diurno": 0.20,
        "irritabilidad": 0.20,
    }
}

RECS: Dict[str, str] = {
    "Resfriado Común": "Hidratación constante, descanso y analgésicos de venta libre si es necesario.",
    "Gripe Estacional": "Reposo absoluto, mucha hidratación. Consulte al médico si la fiebre es muy alta.",
    "COVID-19": "Aislamiento preventivo, uso de mascarilla y monitoreo de oxígeno. Busque ayuda si falta el aire.",
    "Migraña": "Descanso en habitación oscura y silenciosa. Tome su medicación prescrita si la tiene.",
    "Cefalea Tensional": "Realice estiramientos de cuello, mejore su postura y tome pausas activas.",
    "Gastroenteritis": "Dieta blanda y suero oral para evitar deshidratación. Evite lácteos.",
    "Indigestión / Acidez": "Evite comidas pesadas, picantes o grasas. No se acueste inmediatamente después de comer.",
    "Alergia Estacional": "Evite alérgenos conocidos. Consulte sobre antihistamínicos si los síntomas persisten.",
    "Ansiedad Generalizada": "Pruebe técnicas de respiración profunda. Si interfiere con su vida diaria, busque apoyo psicológico.",
    "Dermatitis / Eczema": "Mantenga la piel hidratada con cremas neutras. Evite rascarse y el uso de jabones agresivos.",
    "Conjuntivitis": "Lave sus ojos con suero fisiológico. No comparta toallas y evite tocarse los ojos.",
    "Sinusitis": "Lavados nasales con agua salina, inhalaciones de vapor y mucha hidratación.",
    "Faringitis / Amigdalitis": "Gárgaras con agua tibia y sal, miel con limón y analgésicos si hay dolor.",
    "Otitis": "Evite mojar el oído. Aplique calor seco local. Consulte al médico si hay supuración.",
    "Contractura / Lumbalgia": "Calor local, estiramientos suaves y evitar levantar peso. Mejore su postura.",
    "Deshidratación": "Beba agua o suero oral en pequeños sorbos constantes. Evite el sol directo.",
    "Anemia": "Consuma alimentos ricos en hierro (carnes rojas, espinacas, lentejas). Consulte a un médico para análisis.",
    "Insomnio": "Mantenga una rutina de sueño regular. Evite pantallas y cafeína antes de dormir.",
}

# --- LÓGICA DE IA (NLP) ---

# Diccionario de sinónimos para normalizar lenguaje coloquial
SYNONYMS = {
    # Cabeza
    "jaqueca": S_DOLOR_CABEZA, "cefalea": S_DOLOR_CABEZA, "coco": S_DOLOR_CABEZA,
    # Estomago
    "panza": "dolor abdominal", "barriga": "dolor abdominal", "tripa": "dolor abdominal", "estomago": "dolor abdominal",
    "ardor": "ardor de estomago", "acidez": "ardor de estomago", "reflujo": "ardor de estomago",
    # Vomito
    "devolver": "vomitos", "guacara": "vomitos", "arqueada": "vomitos", "vomito": "vomitos",
    # Fiebre
    "calentura": S_FIEBRE, "temperatura": S_FIEBRE, "ardiendo": S_FIEBRE, "febrícula": S_FIEBRE,
    # Cansancio
    "fatiga": "fatiga extrema", "agotamiento": "fatiga extrema", "sueño": "fatiga extrema", "debilidad": "fatiga extrema", "cansado": "fatiga extrema",
    "debil": "fatiga extrema", "devil": "fatiga extrema", "sin fuerzas": "fatiga extrema", "bajon": "fatiga extrema",
    # Respirar
    "aire": "dificultad para respirar", "ahogo": "dificultad para respirar", "asfixia": "dificultad para respirar", "disnea": "dificultad para respirar",
    # Piel
    "ronchas": "erupcion cutanea", "granos": "erupcion cutanea", "sarpullido": "erupcion cutanea", "pica": "picazon en piel", "comezon": "picazon en piel",
    # Ojos
    "lagaña": "lagañas", "rojo": "ojo rojo",
    # ORL
    "tragar": "dificultad para tragar", "pasar": "dificultad para tragar", "garganta": "dolor de garganta",
    "oido": "dolor de oido", "oreja": "dolor de oido", "zumbido": "dolor de oido",
    "moco": "congestion nasal", "tupido": "congestion nasal", "constipado": "congestion nasal",
    # Muscular
    "espalda": "dolor de espalda", "cintura": "dolor lumbar", "lumbago": "dolor lumbar", "riñones": "dolor lumbar",
    "tieso": "rigidez muscular", "duro": "rigidez muscular",
    # General
    "sed": "sed excesiva", "seca": "boca seca", "seco": "boca seca",
    "palido": "palidez", "blanco": "palidez", "amarillo": "palidez",
    "frio": "frio", "helado": "frio",
    # Sueño
    "dormir": "dificultad para dormir", "despierto": "despertar nocturno", "desvelo": "dificultad para dormir"
}

# Palabras vacías en español para filtrar ruido
STOPWORDS = {
    "el", "la", "los", "las", "un", "una", "unos", "unas", "y", "o", "pero", "si", "no", "en", "de", "del", "al", "a", "con", "sin", "por", "para",
    "mi", "mis", "tu", "tus", "su", "sus", "me", "te", "se", "nos", "le", "les", "lo", "la", "que", "cual", "quien", "donde", "cuando", "como",
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
        red_flags = ["dificultad para respirar", "dolor de pecho", "perdida de conciencia"]
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

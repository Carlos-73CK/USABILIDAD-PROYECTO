import httpx
import time

def test_ai():
    url = "http://127.0.0.1:8000/diagnose"
    
    # Frases en lenguaje natural para probar la IA
    # Nota como usamos lenguaje coloquial, no términos médicos exactos
    scenarios = [
        ["Siento que la cabeza me va a estallar y me molesta mucho la luz"], # Debería detectar Migraña
        ["Tengo el cuerpo cortado, mucha temperatura y escalofríos"], # Debería detectar Gripe
        ["No paro de ir al baño y me duele mucho la panza"], # Debería detectar Gastroenteritis
        ["Tengo tos seca y no huelo nada"], # Debería detectar COVID-19
    ]

    print("--- 🤖 INICIANDO PRUEBA DE IA MÉDICA ---")
    print(f"Objetivo: {url}\n")
    
    for symptoms in scenarios:
        print(f"📝 Entrada Usuario: '{symptoms[0]}'")
        try:
            # Enviamos la petición POST al backend
            response = httpx.post(url, json=symptoms)
            
            if response.status_code == 200:
                diagnoses = response.json()
                if not diagnoses:
                    print("   ⚠️  La IA no encontró coincidencias.")
                for d in diagnoses:
                    # Mostramos la condición y la confianza que la IA calculó
                    print(f"   ✅ Predicción: {d['condition']} (Confianza: {d['confidence']})")
                    print(f"      Recomendación: {d['recommendation'][:50]}...")
            else:
                print(f"   ❌ Error del servidor: {response.status_code}")
        except httpx.ConnectError:
            print("   ❌ Error: No se pudo conectar al backend.")
            print("      -> Asegúrate de ejecutar 'uvicorn app.main:app --reload' en la carpeta backend")
            return
        except Exception as e:
            print(f"   ❌ Error inesperado: {e}")
        
        print("-" * 50)

if __name__ == "__main__":
    test_ai()

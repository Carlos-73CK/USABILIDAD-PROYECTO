"""
Validador de archivos JSON para el sistema de diagnóstico IA.
Verifica estructura, duplicados y sintaxis.
"""

import json
import os
from pathlib import Path
from collections import Counter

def validate_ai_data():
    ai_data_path = Path(__file__).parent / "app" / "services" / "ai_data"
    
    if not ai_data_path.exists():
        print(f"❌ Error: No se encontró el directorio {ai_data_path}")
        return False
    
    all_diagnoses = {}
    all_symptoms = Counter()
    total_files = 0
    total_diagnoses = 0
    errors = []
    
    print("=" * 60)
    print("🔍 VALIDANDO ARCHIVOS DE DATOS IA")
    print("=" * 60)
    
    json_files = list(ai_data_path.glob("*.json"))
    
    if not json_files:
        print("❌ No se encontraron archivos JSON")
        return False
    
    for json_file in sorted(json_files):
        total_files += 1
        print(f"\n📄 Validando: {json_file.name}")
        
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            errors.append(f"  ❌ Error de sintaxis JSON en {json_file.name}: {e}")
            print(f"  ❌ Error de sintaxis JSON: {e}")
            continue
        except Exception as e:
            errors.append(f"  ❌ Error al leer {json_file.name}: {e}")
            print(f"  ❌ Error al leer: {e}")
            continue
        
        # Verificar estructura
        if "diagnoses" not in data:
            errors.append(f"  ❌ {json_file.name}: Falta la clave 'diagnoses'")
            print(f"  ❌ Falta la clave 'diagnoses'")
            continue
        
        diagnoses = data["diagnoses"]
        file_diagnosis_count = 0
        
        for diag_name, diag_data in diagnoses.items():
            file_diagnosis_count += 1
            total_diagnoses += 1
            
            # Verificar duplicados entre archivos
            if diag_name in all_diagnoses:
                errors.append(f"  ⚠️ Diagnóstico duplicado: '{diag_name}' (también en {all_diagnoses[diag_name]})")
                print(f"  ⚠️ DUPLICADO: '{diag_name}' ya existe en {all_diagnoses[diag_name]}")
            else:
                all_diagnoses[diag_name] = json_file.name
            
            # Verificar estructura del diagnóstico
            if "symptoms" not in diag_data:
                errors.append(f"  ❌ '{diag_name}': Falta 'symptoms'")
                print(f"  ❌ '{diag_name}': Falta 'symptoms'")
            else:
                for symptom, weight in diag_data["symptoms"].items():
                    all_symptoms[symptom] += 1
                    if not isinstance(weight, (int, float)) or weight <= 0 or weight > 1:
                        errors.append(f"  ⚠️ '{diag_name}' -> '{symptom}': Peso inválido ({weight})")
            
            if "recommendation" not in diag_data:
                errors.append(f"  ❌ '{diag_name}': Falta 'recommendation'")
                print(f"  ❌ '{diag_name}': Falta 'recommendation'")
        
        print(f"  ✅ {file_diagnosis_count} diagnósticos encontrados")
    
    # Resumen
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE VALIDACIÓN")
    print("=" * 60)
    print(f"📁 Archivos procesados: {total_files}")
    print(f"🏥 Total diagnósticos: {total_diagnoses}")
    print(f"🩺 Síntomas únicos: {len(all_symptoms)}")
    
    if errors:
        print(f"\n❌ Se encontraron {len(errors)} errores/advertencias:")
        for error in errors:
            print(error)
        return False
    else:
        print("\n✅ Todos los archivos son válidos!")
        return True

if __name__ == "__main__":
    success = validate_ai_data()
    exit(0 if success else 1)

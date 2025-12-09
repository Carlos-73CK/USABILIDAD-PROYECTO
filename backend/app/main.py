from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

from .services.ai_stub import suggest_diagnoses
from .services.history_repo import add_record, list_records, delete_record
from .schemas import SymptomInput, DiagnoseResponse, HistoryResponse
from .services.supabase_client import get_supabase, SUPABASE_URL, SUPABASE_ANON_KEY

load_dotenv()

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app = FastAPI(
    title="Diagnóstico Preliminar API",
    description=(
        "API para análisis preliminar de síntomas. No sustituye atención médica."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/diagnose", response_model=DiagnoseResponse)
async def diagnose(payload: SymptomInput):
    # Llamada a stub IA (luego se puede reemplazar por modelo real)
    suggestions = suggest_diagnoses(payload.symptoms)
    response = DiagnoseResponse(
        disclaimer=(
            "Esto no sustituye una consulta médica; es orientación preliminar."
        ),
        diagnoses=suggestions,
    )
    # Persistir en Supabase si está configurado
    if SUPABASE_URL and SUPABASE_ANON_KEY:
        try:
            sb = get_supabase()
            sb.table("queries").insert({
                "user_id": None,
                "input_symptoms": payload.symptoms,
                "result": response.model_dump(),
            }).execute()
        except Exception:
            # No interrumpir el flujo si la BD falla
            pass
    else:
        # Persistencia local en archivo JSON
        try:
            add_record(payload.symptoms, response.model_dump(), None)
        except Exception:
            # No interrumpir el flujo si la escritura local falla
            pass
    return response


@app.get("/history", response_model=HistoryResponse)
async def history():
    # Prioridad a Supabase si está configurado
    if SUPABASE_URL and SUPABASE_ANON_KEY:
        try:
            sb = get_supabase()
            data = sb.table("queries").select("id,user_id,input_symptoms,result,created_at").order("created_at", desc=True).limit(50).execute()
            items = data.data or []
            return {"items": items}
        except Exception:
            # Fallback a almacenamiento local si falla supabase
            try:
                return {"items": list_records(50)}
            except Exception:
                return {"items": []}
    # Almacenamiento local
    try:
        return {"items": list_records(50)}
    except Exception:
        return {"items": []}


@app.delete("/history/{rec_id}")
async def delete_history(rec_id: str):
    # Si Supabase estuviera activo, aquí se podría borrar también en BD
    ok = False
    if SUPABASE_URL and SUPABASE_ANON_KEY:
        try:
            sb = get_supabase()
            sb.table("queries").delete().eq("id", rec_id).execute()
            ok = True
        except Exception:
            ok = False
    # Borrar localmente también
    try:
        ok_local = delete_record(rec_id)
        ok = ok or ok_local
    except Exception:
        pass
    return {"ok": ok}

# Backend — FastAPI

API para diagnóstico preliminar y servicios auxiliares.

## Requisitos
- Python 3.11+

## Instalación

1. Crear entorno virtual
2. Instalar dependencias
3. Ejecutar servidor

Comandos (PowerShell):

```
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Variables de entorno

Crea un archivo `.env` basado en `.env.example`:

- SUPABASE_URL=
- SUPABASE_ANON_KEY=
- DATABASE_URL= (opcional si usas Supabase solo)
- ALLOWED_ORIGINS=http://localhost:5173

## Endpoints
- GET /health — chequeo simple
- POST /diagnose — ingreso de síntomas y retorno de diagnósticos preliminares

## Pruebas

```
pytest
```

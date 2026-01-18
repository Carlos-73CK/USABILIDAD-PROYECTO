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

Crea un archivo `.env` con UNA de estas opciones:

- Opción A (recomendada):
	- DATABASE_URL=mysql+pymysql://root:@localhost:3306/usabilidad-proyecto

- Opción B (equivalente, por partes):
	- DB_USER=root
	- DB_PASSWORD=
	- DB_HOST=localhost
	- DB_PORT=3306
	- DB_NAME=usabilidad-proyecto

- ALLOWED_ORIGINS=http://localhost:5173

## Endpoints
- GET /health — chequeo simple
- POST /diagnose — ingreso de síntomas y retorno de diagnósticos preliminares

## Pruebas

```
pytest
```

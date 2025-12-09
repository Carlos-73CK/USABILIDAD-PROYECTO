# API

Base URL: `http://localhost:8000`

## GET /health
- 200 OK: `{ "status": "ok" }`

## POST /diagnose
Request
```
{
  "symptoms": ["fiebre", "tos"]
}
```

Response
```
{
  "disclaimer": "Esto no sustituye una consulta médica; es orientación preliminar.",
  "diagnoses": [
    {
      "condition": "Gripe",
      "confidence": 0.7,
      "recommendation": "Reposo, hidratación..."
    }
  ]
}
```

Notas
- Validar entrada como lista de strings.
- Mensajes en español, claros y cortos.

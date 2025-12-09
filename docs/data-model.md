# Modelo de datos (Supabase / Postgres)

Tablas propuestas:

- users
  - id (uuid, pk)
  - email (unique)
  - created_at (timestamptz)

- symptoms
  - id (uuid, pk)
  - name (text, unique)

- conditions
  - id (uuid, pk)
  - name (text, unique)

- rules
  - id (uuid, pk)
  - symptom_id (uuid, fk symptoms)
  - condition_id (uuid, fk conditions)
  - weight (float)

- queries
  - id (uuid, pk)
  - user_id (uuid, fk users, nullable)
  - input_symptoms (text[])
  - result (jsonb)
  - created_at (timestamptz)

Políticas RLS
- Habilitar RLS en `queries`, permitir `select/insert` al usuario autenticado solo sobre sus registros.

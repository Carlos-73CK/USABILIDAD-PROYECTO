# Guía de conexión a Supabase

## 1) Crear proyecto
- Ve a https://supabase.com y crea un proyecto (elige la base gratuita).
- Copia `Project URL` y `Anon Key` de Settings → API.

## 2) Variables de entorno
- Backend: copia `.env.example` a `.env` y rellena:
  - SUPABASE_URL=
  - SUPABASE_ANON_KEY=
- Frontend: copia `.env.example` a `.env` y rellena:
  - VITE_SUPABASE_URL=
  - VITE_SUPABASE_ANON_KEY=

## 3) Tablas mínimas
Ejecuta en SQL Editor:

```sql
-- Requerido para gen_random_uuid()
create extension if not exists pgcrypto;

create table if not exists symptoms (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

create table if not exists conditions (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

create table if not exists rules (
  id uuid primary key default gen_random_uuid(),
  symptom_id uuid references symptoms(id) on delete cascade,
  condition_id uuid references conditions(id) on delete cascade,
  weight double precision not null default 0.5
);

create table if not exists queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  input_symptoms text[] not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);
```

## 4) Seguridad (RLS)

```
alter table queries enable row level security;
create policy "own queries" on queries for select using (auth.uid() = user_id);
create policy "insert own" on queries for insert with check (auth.uid() = user_id);
```

Nota: Ajusta según necesidades. Puedes mantener `queries.user_id` null para consultas anónimas.

## 5) Probar desde backend
- `get_supabase()` usa `SUPABASE_URL` y `SUPABASE_ANON_KEY`.
- Ejemplo de inserción:

```python
from app.services.supabase_client import get_supabase
sb = get_supabase()
sb.table('queries').insert({
  'user_id': None,
  'input_symptoms': ['fiebre','tos'],
  'result': {'diagnoses': []}
}).execute()
```

# Modelo de datos (MySQL)

Este proyecto usa MySQL (por ejemplo con XAMPP) vía SQLAlchemy.

Tablas actuales:

- users
  - id (int, pk, autoincrement)
  - email (varchar, unique)
  - password_hash (varchar)
  - full_name (varchar, nullable)
  - created_at (datetime)
  - failed_login_attempts (int)
  - locked_until (datetime, nullable)

- history
  - id (int, pk, autoincrement)
  - user_id (int, fk -> users.id)
  - symptoms (text)
  - diagnosis_result (text, nullable)
  - created_at (datetime)

Notas
- El historial está asociado al usuario autenticado.

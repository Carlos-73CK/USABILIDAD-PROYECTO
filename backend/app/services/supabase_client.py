"""Compatibilidad histórica: Supabase ya no se usa.

El proyecto actual persiste datos vía SQLAlchemy + MySQL (XAMPP).
Este módulo se mantiene como stub para no romper importaciones antiguas
en documentación o ramas viejas.
"""

from typing import Any


def get_supabase() -> Any:
    raise RuntimeError(
        "Supabase no está habilitado en este proyecto. "
        "Use el backend con MySQL (XAMPP) o reintroduzca Supabase explícitamente."
    )
    Evita errores de importación cuando las dependencias aún no están instaladas.

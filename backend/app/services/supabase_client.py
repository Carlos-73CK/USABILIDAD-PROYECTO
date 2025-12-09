import os
from typing import Any, Optional
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

_sb: Optional[Any] = None


def get_supabase() -> Any:
    """Obtiene el cliente de Supabase perezosamente.

    Evita errores de importación cuando las dependencias aún no están instaladas.
    """
    global _sb
    if _sb is None:
        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            raise RuntimeError("SUPABASE_URL o SUPABASE_ANON_KEY no configurados.")
        try:
            from supabase import create_client  # type: ignore
        except Exception as e:  # pragma: no cover
            raise RuntimeError(
                "La librería 'supabase' no está instalada. Ejecuta 'pip install -r requirements.txt'."
            ) from e
        _sb = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    return _sb

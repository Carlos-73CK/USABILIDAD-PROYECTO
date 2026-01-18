# Nota: Supabase no se usa

Esta guía quedó de una versión anterior del proyecto.

El proyecto actual usa MySQL (por ejemplo con XAMPP) vía SQLAlchemy.

## Setup MySQL (XAMPP)

1) Inicia Apache y MySQL en XAMPP.

2) Crea una base de datos, por ejemplo `usabilidad_accesibilidad`.

3) Configura el backend con `DATABASE_URL` apuntando a MySQL:

```dotenv
DATABASE_URL=mysql+pymysql://root:@localhost:3306/usabilidad_accesibilidad
ALLOWED_ORIGINS=http://localhost:5173
```

4) Arranca el backend y verifica salud:

- `GET http://127.0.0.1:8000/health`

Si en el futuro quieres volver a Supabase, tendrás que reintroducir dependencias y ajustar el repositorio.

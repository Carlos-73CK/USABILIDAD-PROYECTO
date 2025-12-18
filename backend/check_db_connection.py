import sys
import os
from sqlalchemy import create_engine, inspect, text

# Add the parent directory to sys.path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SQLALCHEMY_DATABASE_URL

def check_db():
    print(f"Intentando conectar a: {SQLALCHEMY_DATABASE_URL}")
    try:
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
        with engine.connect() as connection:
            print("✅ Conexión exitosa a la base de datos.")
            
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            print(f"Tablas encontradas: {tables}")
            
            required_tables = ["users", "history"]
            missing_tables = [t for t in required_tables if t not in tables]
            
            if missing_tables:
                print(f"❌ Faltan las siguientes tablas: {missing_tables}")
                print("   -> Probablemente necesitas ejecutar la creación de tablas.")
            else:
                print("✅ Todas las tablas requeridas existen.")
                
                # Check if users table has data
                result = connection.execute(text("SELECT count(*) FROM users"))
                count = result.scalar()
                print(f"   -> Número de usuarios en la base de datos: {count}")

    except Exception as e:
        print(f"❌ Error al conectar a la base de datos: {e}")
        if "Unknown database" in str(e):
            print("   -> La base de datos 'usabilidad-proyecto' NO existe en MySQL.")
            print("   -> Crea la base de datos en phpMyAdmin o ejecuta el comando SQL: CREATE DATABASE `usabilidad-proyecto`;")

if __name__ == "__main__":
    check_db()

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import json

from .database import engine, Base, get_db
from . import models, auth, schemas
from .services.ai_stub import suggest_diagnoses

# Crear tablas si no existen (útil para dev, en prod usar migraciones)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Diagnóstico Preliminar API",
    description="API con autenticación y base de datos MySQL local.",
    version="0.2.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permitir todo para desarrollo local
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AUTH ROUTES ---

@app.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, password_hash=hashed_password, full_name=user.full_name)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Usuario creado exitosamente"}

@app.post("/reset-password")
def reset_password(reset_data: schemas.PasswordReset, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == reset_data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    hashed_password = auth.get_password_hash(reset_data.new_password)
    user.password_hash = hashed_password
    db.commit()
    return {"message": "Contraseña actualizada exitosamente"}

@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    # Verificar bloqueo
    if user and user.locked_until and user.locked_until > datetime.utcnow():
        raise HTTPException(status_code=400, detail="Cuenta bloqueada temporalmente. Intente más tarde.")

    if not user or not auth.verify_password(form_data.password, user.password_hash):
        if user:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 3:
                user.locked_until = datetime.utcnow() + timedelta(minutes=15) # Bloqueo de 15 min
                db.commit()
                raise HTTPException(status_code=400, detail="Cuenta bloqueada por 15 minutos debido a múltiples intentos fallidos.")
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Resetear intentos fallidos si login exitoso
    if user.failed_login_attempts > 0:
        user.failed_login_attempts = 0
        user.locked_until = None
        db.commit()

    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user_name": user.full_name}

@app.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return schemas.UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        created_at=current_user.created_at
    )

@app.put("/users/me")
def update_user_me(data: schemas.UserUpdate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if data.full_name:
        current_user.full_name = data.full_name
    if data.password:
        current_user.password_hash = auth.get_password_hash(data.password)
    
    db.commit()
    db.refresh(current_user)
    return {"message": "Perfil actualizado"}

# --- DIAGNOSIS ROUTES ---

@app.post("/diagnose", response_model=schemas.DiagnoseResponse)
def diagnose(payload: schemas.SymptomInput, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # 1. IA Stub
    suggestions = suggest_diagnoses(payload.symptoms)
    
    # 2. Guardar en Historial MySQL
    diagnosis_json = json.dumps([d.dict() for d in suggestions])
    symptoms_str = ", ".join(payload.symptoms)
    
    history_entry = models.History(
        user_id=current_user.id,
        symptoms=symptoms_str,
        diagnosis_result=diagnosis_json
    )
    db.add(history_entry)
    db.commit()

    return schemas.DiagnoseResponse(
        disclaimer="Esto no sustituye una consulta médica; es orientación preliminar.",
        diagnoses=suggestions
    )

@app.get("/history")
def get_history(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    records = db.query(models.History).filter(models.History.user_id == current_user.id).order_by(models.History.created_at.desc()).all()
    
    # Formatear respuesta
    result = []
    for r in records:
        try:
            dx = json.loads(r.diagnosis_result)
        except:
            dx = []
        result.append({
            "id": r.id,
            "date": r.created_at.isoformat(),
            "symptoms": r.symptoms.split(", "),
            "diagnoses": dx
        })
    return result

@app.get("/health")
def health():
    return {"status": "ok", "db": "mysql"}

@app.delete("/history/{item_id}")
def delete_history(item_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    record = db.query(models.History).filter(models.History.id == item_id, models.History.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    
    db.delete(record)
    db.commit()
    return {"status": "deleted"}


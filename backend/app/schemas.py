from pydantic import BaseModel, Field, EmailStr
from typing import List, Any, Optional
from datetime import datetime

# --- USER SCHEMAS ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = None

class PasswordReset(BaseModel):
    email: EmailStr
    new_password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# --- DIAGNOSIS SCHEMAS ---
class SymptomInput(BaseModel):
  symptoms: List[str] = Field(..., description="Lista de síntomas en texto")

class Diagnosis(BaseModel):
  condition: str
  confidence: float = Field(ge=0.0, le=1.0)
  recommendation: str

class DiagnoseResponse(BaseModel):
  disclaimer: str
  diagnoses: List[Diagnosis]

class HistoryItem(BaseModel):
    id: int
    date: str
    symptoms: List[str]
    diagnoses: List[Diagnosis]

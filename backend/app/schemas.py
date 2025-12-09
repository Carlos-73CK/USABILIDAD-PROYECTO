from pydantic import BaseModel, Field
from typing import List, Any
from datetime import datetime


class SymptomInput(BaseModel):
  symptoms: List[str] = Field(..., description="Lista de síntomas en texto")


class Diagnosis(BaseModel):
  condition: str
  confidence: float = Field(ge=0.0, le=1.0)
  recommendation: str


class DiagnoseResponse(BaseModel):
  disclaimer: str
  diagnoses: List[Diagnosis]


class QueryRecord(BaseModel):
  id: str
  user_id: str | None = None
  input_symptoms: List[str]
  result: Any
  created_at: datetime


class HistoryResponse(BaseModel):
  items: List[QueryRecord]

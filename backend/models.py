from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class PlanRequest(BaseModel):
    subjects: List[str]
    topics: str
    deadline: date
    hours_per_day: float

class TaskModel(BaseModel):
    id: Optional[str] = None
    subject_id: Optional[str] = None
    topic: str
    date: str # YYYY-MM-DD
    duration: float
    status: str = "pending"

class RescheduleRequest(BaseModel):
    hours_per_day: float

class UpdateTaskStatus(BaseModel):
    status: str

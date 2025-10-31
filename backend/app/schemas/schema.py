from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from fastapi import UploadFile


class RegisterUser(BaseModel):
    name: str = Field(..., min_length=2, max_length=50, description="Full name of the user")
    email: EmailStr = Field(..., description="Valid email address of the user")
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters long")

class LoginUser(BaseModel):
    email: EmailStr = Field(..., description="Valid email address of the user")
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters long")

class SetupInterviewSchema(BaseModel):
    user_id: str
    domain: str = Field(..., min_length=2, max_length=50, description="Domain or Job Role of the user")
    experience: str = Field(..., description="Total years of experience the user has")
    interview_type: str = Field(..., description="Type of the interview to be done (e.g., Technical, Managerial/Leadership, etc.)")
    mode: str = Field(..., description="Mode of interview to be done (Text or Voice)")
    difficulty: str = Field(..., description="Difficulty of the interview")

class ReceiveFirstAITextSchema(BaseModel):
    interview_id: str
    user_name: str
    domain: str = Field(..., min_length=2, max_length=50, description="Domain or Job Role of the user")
    interview_type: str = Field(..., description="Type of the interview to be done (e.g., Technical, Managerial/Leadership, etc.)")

class EmployeeInterviewAnswers(BaseModel):
    sender: str
    text: str
    file: Optional[UploadFile] = None

class AIRequestSchema(BaseModel):
    question_count: int

class LogInterviewTimerSchema(BaseModel):
    interview_id: str
    timer: int
    completion: Optional[str] = None

class GenerateReportSchema(BaseModel):
    time: Optional[int] = 0
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.db import connect_to_mongo, close_mongo_connection
from app.routes.auth_routes import router as auth_router
from app.routes.interview_routes import router as interview_router
from app.routes.interview_report_routes import router as interview_report_router
from app.routes.history_report_routes import router as history_router
from app.routes.profile_routes import router as profile_router
from app.routes.dashboard_routes import router as dashboard_router

app = FastAPI(title="IntervIQ Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(interview_router)
app.include_router(interview_report_router)
app.include_router(history_router)
app.include_router(profile_router)
app.include_router(dashboard_router)

@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

@app.get("/")
async def root():
    return {"message": "IntervIQ API is running"}

from fastapi import FastAPI
from routes import router as auth_router
from database import engine
from sqlmodel import SQLModel

app = FastAPI()

@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)

app.include_router(auth_router, prefix="/api/v1", tags=["Authentication"])

@app.get("/")
def root():
    return {"message": "Chore Wheel API Integrated"}

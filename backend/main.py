# Breanna's main needs to be this 

from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Session, select
from database import engine, get_session, create_db_and_tables
from models import User, Chore, Reward
from routes import router as auth_router

app = FastAPI()

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# Path will be: /api/v1/auth/login
app.include_router(auth_router, prefix="/api/v1", tags=["Authentication"])

@app.get("/")
def root():
    return {"message": "Chore Wheel API Integrated and Running"}

# Path will be: /api/v1/chores
@app.get("/api/v1/chores")
def get_chores(session: Session = Depends(get_session)):
    statement = select(Chore)
    results = session.exec(statement).all()
    return results

@app.post("/api/v1/chores")
def create_chore(chore: Chore, session: Session = Depends(get_session)):
    session.add(chore)
    session.commit()
    session.refresh(chore)
    return chore

@app.post("/api/v1/chores/{chore_id}/complete")
def complete_chore(chore_id: int, session: Session = Depends(get_session)):
    chore = session.get(Chore, chore_id)
    if not chore:
        raise HTTPException(status_code=404, detail="Chore not found")
    
    chore.status = "pending_approval"
    session.add(chore)
    session.commit()
    return {"message": f"Chore {chore_id} sent for approval"}

@app.post("/api/v1/chores/{chore_id}/approve")
def approve_chore(chore_id: int, session: Session = Depends(get_session)):
    chore = session.get(Chore, chore_id)
    if not chore or chore.status != "pending_approval":
        raise HTTPException(status_code=400, detail="Invalid chore state")

    chore.status = "completed"
    
    if chore.user_id:
        user = session.get(User, chore.user_id)
        if user:
            user.total_points += chore.points_worth
            session.add(user)

    session.add(chore)
    session.commit()
    return {"message": "Chore approved and points awarded"}

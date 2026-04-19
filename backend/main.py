from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from database import engine, get_session, create_db_and_tables
from models import User, Chore, Reward
from routes import router as auth_router

from slowapi.errors import RateLimitExceeded
from rate_limit import limiter, rate_limit_handler

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://10.0.0.146:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register the rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)

# Include Breanna's authentication routes
app.include_router(auth_router)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/")
def read_root():
    return {"message": "API is running"}

@app.get("/chores")
def get_chores(session: Session = Depends(get_session)):
    statement = select(Chore)
    results = session.exec(statement).all()
    return results

#make sure to at depends on user
@app.post("/chores")
def create_chore(chore: Chore, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    session.add(chore)
    session.commit()
    session.refresh(chore)
    return chore

@app.put("/chores/{chore_id}/complete")
def complete_chore(chore_id: int, session: Session = Depends(get_session)):
    chore = session.get(Chore, chore_id)
    if not chore:
        raise HTTPException(status_code=404, detail="Chore not found")
    
    chore.status = "pending_approval"
    session.add(chore)
    session.commit()
    return {"message": f"Chore {chore_id} sent for approval"}

@app.put("/chores/{chore_id}/approve")
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

@app.delete("/chores/{chore_id}")
def delete_chore(chore_id: int, session: Session = Depends(get_session)):
    chore = session.get(Chore, chore_id)
    if not chore:
        raise HTTPException(status_code=404, detail="Chore not found")
    
    session.delete(chore)
    session.commit()
    return {"message": "Chore deleted completely"}


#new
@app.patch("/chores/{chore_id}/assign/{user_id}")
def assign_chore(chore_id: int, user_id: int, session: Session = Depends(get_session)):
    chore = session.get(Chore, chore_id)
    user = session.get(User, user_id)
    if not chore or not user:
        raise HTTPException(status_code=404, detail="Chore or User not found")
    
    chore.user_id = user_id
    session.add(chore)
    session.commit()
    return {"message": "Chore assigned successfully"}

from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Session, select
from database import engine, get_session, create_db_and_tables
from models import User, Chore, Reward

app = FastAPI()

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/chores")
def get_chores(session: Session = Depends(get_session)):
    statement = select(Chore)
    results = session.exec(statement).all()
    return results

@app.post("/chores")
def create_chore(chore: Chore, session: Session = Depends(get_session)):
    session.add(chore)
    session.commit()
    session.refresh(chore)
    return chore

@app.post("/chores/{chore_id}/complete")
def complete_chore(chore_id: int, session: Session = Depends(get_session)):
    chore = session.get(Chore, chore_id)
    if not chore:
        raise HTTPException(status_code=404, detail="Chore not found")
    
    chore.status = "pending_approval"
    session.add(chore)
    session.commit()
    return {"message": f"Chore {chore_id} sent for approval"}

@app.post("/chores/{chore_id}/approve")
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





''' #previous code
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "API is running"}


@app.get("/chores")
def get_chores():
    return [
        {"id": 1, "title": "Clean room", "status": "assigned"},
        {"id": 2, "title": "Wash dishes", "status": "completed"} 
        
    ]

@app.post("/chores")
def create_chore(chore: dict):
    return {"message": "Chore created", "chore": chore}

@app.post("/chores/{chore_id}/complete")
def complete_chore(chore_id: int):
    return {"message": f"Chore {chore_id} marked complete"}

@app.post("/chores/{chore_id}/approve")
def approve_chore(chore_id: int):
    return [
        {"id": 1, "name": "Ice cream", "points_required": 20},
        {"id": 2, "name": "Movie night", "points_required": 50}
    ]
'''


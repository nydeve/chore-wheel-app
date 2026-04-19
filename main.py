import random
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

import datetime
from typing import Optional
from pydantic import BaseModel
from database import engine, get_session, create_db_and_tables
from models import User, Chore, Reward, ClaimedReward, PointTransaction, Notification
from routes import router as auth_router
from roles import get_current_user

from slowapi.errors import RateLimitExceeded
from rate_limit import limiter, rate_limit_handler

def get_family_id(user: User) -> int:
    return user.parent_id if user.parent_id else user.id

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://10.0.0.146:3000", "https://danilagurin.com", "https://www.danilagurin.com"],
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

@app.get("/", tags=["System"], summary="API Health Check")
def read_root():
    """Returns a simple success message indicating the backend is running."""
    return {"message": "API is running"}

@app.get("/chores", tags=["Chores"], summary="Get all chores")
def get_chores(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Retrieves all chores specifically within the active family tenant."""
    fam_id = get_family_id(current_user)
    statement = select(Chore).where(Chore.family_id == fam_id)
    results = session.exec(statement).all()
    return results

@app.post("/chores", tags=["Chores"], summary="Create a new chore")
def create_chore(chore: Chore, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """
    Creates a new chore. 
    Accepts an optional due_date and assignee user_id.
    """
    fam_id = get_family_id(current_user)
    chore.family_id = fam_id
    
    if chore.due_date:
        if isinstance(chore.due_date, str):
            import datetime
            try:
                chore.due_date = datetime.datetime.fromisoformat(chore.due_date.replace("Z", "+00:00"))
            except ValueError:
                chore.due_date = datetime.datetime.strptime(chore.due_date.split("T")[0], "%Y-%m-%d")
        if type(chore.due_date) is datetime.date:
             chore.due_date = datetime.datetime.combine(chore.due_date, datetime.time.min)
             
    session.add(chore)
    session.commit()
    session.refresh(chore)
    return chore

@app.put("/chores/{chore_id}", tags=["Chores"], summary="Edit a chore")
def update_chore(chore_id: int, chore_update: dict, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """
    Allows a Parent to dynamically edit a chore's properties, including title, points, and due date.
    """
    chore = session.get(Chore, chore_id)
    fam_id = get_family_id(current_user)
    if not chore or chore.family_id != fam_id:
        raise HTTPException(status_code=404, detail="Chore not found")
    
    if "title" in chore_update:
        chore.title = chore_update["title"]
    if "points_worth" in chore_update:
        chore.points_worth = chore_update["points_worth"]
    if "user_id" in chore_update:
        chore.user_id = chore_update["user_id"]
    if "due_date" in chore_update:
        val = chore_update["due_date"]
        if val:
            import datetime
            try:
                chore.due_date = datetime.datetime.fromisoformat(val.replace("Z", "+00:00"))
            except ValueError:
                chore.due_date = datetime.datetime.strptime(val.split("T")[0], "%Y-%m-%d")
        else:
            chore.due_date = None
    if "recurrence" in chore_update:
        chore.recurrence = chore_update["recurrence"]
        
    session.add(chore)
    session.commit()
    session.refresh(chore)
    return chore

class SpinRequest(BaseModel):
    user_id: int

@app.post("/chores/spin", tags=["Chores"], summary="Spin the Chore Wheel")
def spin_wheel(req: SpinRequest, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """
    Randomly assigns one unassigned chore to the requesting child user.
    """
    fam_id = get_family_id(current_user)
    statement = select(Chore).where(Chore.family_id == fam_id).where(Chore.user_id == None).where(Chore.status == "assigned")
    unassigned = session.exec(statement).all()
    if not unassigned:
        raise HTTPException(status_code=400, detail="No unassigned chores available on the wheel!")
    
    winning_chore = random.choice(unassigned)
    winning_chore.user_id = req.user_id
    session.add(winning_chore)
    session.commit()
    session.refresh(winning_chore)
    return winning_chore

class CompleteRequest(BaseModel):
    notes: Optional[str] = None

@app.put("/chores/{chore_id}/complete", tags=["Chores"], summary="Mark chore as completed")
def complete_chore(chore_id: int, req: CompleteRequest = None, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Sets a chore's status to 'pending_approval' so Parents can review it."""
    chore = session.get(Chore, chore_id)
    fam_id = get_family_id(current_user)
    if not chore or chore.family_id != fam_id:
        raise HTTPException(status_code=404, detail="Chore not found")
    
    chore.status = "pending_approval"
    if req and req.notes:
        chore.submission_notes = req.notes
        
    # Notify Parent
    if chore.user_id:
        child = session.get(User, chore.user_id)
        if child and child.parent_id:
            n = Notification(user_id=child.parent_id, title="Chore pending review", message=f"{child.display_name} has completed '{chore.title}' and is waiting for approval.")
            session.add(n)
            
    session.add(chore)
    session.commit()
    return {"message": f"Chore {chore_id} sent for approval"}

class RejectRequest(BaseModel):
    feedback: str

@app.put("/chores/{chore_id}/reject", tags=["Chores"], summary="Reject a completed chore")
def reject_chore(chore_id: int, req: RejectRequest, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Rejects a chore, sending it back to 'assigned' status and notifying the child."""
    chore = session.get(Chore, chore_id)
    fam_id = get_family_id(current_user)
    if not chore or chore.family_id != fam_id or chore.status != "pending_approval":
        raise HTTPException(status_code=400, detail="Invalid chore state")
    
    chore.status = "assigned"
    chore.submission_notes = f"Rejected: {req.feedback}" # Force feedback to replace notes
    
    # Notify Child
    if chore.user_id:
        n = Notification(user_id=chore.user_id, title="Chore Rejected", message=f"Your parent asked you to redo '{chore.title}' with feedback: {req.feedback}")
        session.add(n)
        
    session.add(chore)
    session.commit()
    return {"message": "Chore rejected"}

@app.put("/chores/{chore_id}/approve", tags=["Chores"], summary="Approve completed chore")
def approve_chore(chore_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """
    Approves a completed chore.
    Awards the point value to the assigned child and creates a PointTransaction ledger log.
    If the chore is recurring, clones a new instance for the next interval.
    """
    chore = session.get(Chore, chore_id)
    fam_id = get_family_id(current_user)
    if not chore or chore.family_id != fam_id or chore.status != "pending_approval":
        raise HTTPException(status_code=400, detail="Invalid chore state")

    chore.status = "completed"
    
    if chore.user_id:
        user = session.get(User, chore.user_id)
        if user:
            user.total_points += chore.points_worth
            
            # Create a point transaction in the ledger
            pt = PointTransaction(user_id=user.id, amount=chore.points_worth, reason=f"Completed chore: {chore.title}")
            session.add(pt)
            
            # Send notification
            n = Notification(user_id=user.id, title="Chore Approved!", message=f"You earned {chore.points_worth} points for '{chore.title}'!")
            session.add(n)
            
            session.add(user)

    # Handle recurrence cloning
    if chore.recurrence and chore.recurrence != "none":
        from datetime import timedelta
        new_due = None
        if chore.due_date:
            days = 1 if chore.recurrence == "daily" else 7
            new_due = chore.due_date + timedelta(days=days)
            
        new_chore = Chore(
            title=chore.title,
            description=chore.description,
            points_worth=chore.points_worth,
            user_id=chore.user_id,
            due_date=new_due,
            recurrence=chore.recurrence,
            status="assigned"
        )
        session.add(new_chore)

    session.add(chore)
    session.commit()
    return {"message": "Chore approved and points awarded"}

@app.delete("/chores/{chore_id}", tags=["Chores"], summary="Delete a chore")
def delete_chore(chore_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Permanently deletes a chore from the database."""
    chore = session.get(Chore, chore_id)
    fam_id = get_family_id(current_user)
    if not chore or chore.family_id != fam_id:
        raise HTTPException(status_code=404, detail="Chore not found")
    
    session.delete(chore)
    session.commit()
    return {"message": "Chore deleted completely"}

@app.get("/rewards", tags=["Rewards"], summary="Get all rewards")
def get_rewards(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Retrieves all available rewards bound to the active family tenant."""
    fam_id = get_family_id(current_user)
    return session.exec(select(Reward).where(Reward.family_id == fam_id)).all()

@app.post("/rewards", tags=["Rewards"], summary="Create a reward")
def create_reward(reward: Reward, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Creates a new reward isolated to the executing family."""
    reward.family_id = get_family_id(current_user)
    session.add(reward)
    session.commit()
    session.refresh(reward)
    return reward

@app.put("/rewards/{reward_id}", tags=["Rewards"], summary="Edit a reward")
def update_reward(reward_id: int, r_update: dict, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Updates an existing reward's properties."""
    reward = session.get(Reward, reward_id)
    fam_id = get_family_id(current_user)
    if not reward or reward.family_id != fam_id: raise HTTPException(status_code=404)
    if "name" in r_update: reward.name = r_update["name"]
    if "points_required" in r_update: reward.points_required = r_update["points_required"]
    if "icon" in r_update: reward.icon = r_update["icon"]
    if "quantity" in r_update: reward.quantity = r_update["quantity"]
    session.add(reward)
    session.commit()
    return reward

@app.delete("/rewards/{reward_id}", tags=["Rewards"], summary="Delete a reward")
def delete_reward(reward_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Deletes a reward from the store."""
    reward = session.get(Reward, reward_id)
    fam_id = get_family_id(current_user)
    if reward and reward.family_id == fam_id:
        session.delete(reward)
        session.commit()
    return {"message": "Deleted"}

@app.post("/users/{user_id}/redeem/{reward_id}", tags=["Rewards"], summary="Redeem a reward")
def redeem_reward(user_id: int, reward_id: int, session: Session = Depends(get_session)):
    """
    Purchases a reward for a child, deducting points and locking in a claim receipt.
    Logs a negative PointTransaction in the ledger.
    """
    user = session.get(User, user_id)
    reward = session.get(Reward, reward_id)
    if not user or not reward: raise HTTPException(status_code=404)
    if user.total_points < reward.points_required:
        raise HTTPException(status_code=400, detail="Not enough points!")
    if reward.quantity is not None:
        if reward.quantity <= 0:
            raise HTTPException(status_code=400, detail="Out of stock!")
        reward.quantity -= 1
        session.add(reward)
        
    user.total_points -= reward.points_required
    session.add(user)
    
    # Create negative PointTransaction
    pt = PointTransaction(user_id=user.id, amount=-reward.points_required, reason=f"Claimed reward: {reward.name}")
    session.add(pt)
    
    claimed = ClaimedReward(reward_id=reward.id, user_id=user.id, status="pending")
    session.add(claimed)
    
    # Notify Parent
    if user.parent_id:
        n = Notification(user_id=user.parent_id, title="Reward Claimed", message=f"{user.display_name} just cashed in {reward.points_required} points for '{reward.name}'!")
        session.add(n)
    
    session.commit()
    return {"message": "Reward claimed successfully!"}

@app.get("/rewards/pending", tags=["Rewards"], summary="Get pending claims")
def get_pending_rewards(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Retrieves all purchased rewards that have not yet been physically delivered by the parent."""
    fam_id = get_family_id(current_user)
    statement = select(ClaimedReward).where(ClaimedReward.status == "pending")
    claimed = session.exec(statement).all()
    
    results = []
    for c in claimed:
        user = session.get(User, c.user_id)
        if not user or (user.parent_id != fam_id and user.id != fam_id):
            continue
            
        reward = session.get(Reward, c.reward_id)
        if user and reward:
            results.append({
                "id": c.id,
                "child": user.display_name,
                "reward": reward.name,
                "cost": reward.points_required,
                "time": c.created_at
            })
    return results

@app.put("/rewards/claimed/{claim_id}/fulfill", tags=["Rewards"], summary="Fulfill a claimed reward")
def fulfill_reward(claim_id: int, session: Session = Depends(get_session)):
    """Marks a claimed reward as 'fulfilled', dismissing it from the pending dashboard."""
    claim = session.get(ClaimedReward, claim_id)
    if claim:
        claim.status = "fulfilled"
        session.add(claim)
        
        # Notify Child
        reward = session.get(Reward, claim.reward_id)
        r_name = reward.name if reward else "your reward"
        n = Notification(user_id=claim.user_id, title="Reward Fulfilled!", message=f"Your parent has fulfilled {r_name}!")
        session.add(n)
        
        session.commit()
    return {"message": "Fulfilled"}

@app.get("/notifications", tags=["System"], summary="Get User Notifications")
def get_notifications(user_id: int, session: Session = Depends(get_session)):
    """Get all notifications for a specific user ID."""
    statement = select(Notification).where(Notification.user_id == user_id).order_by(Notification.created_at.desc())
    return session.exec(statement).all()

@app.put("/notifications/{notif_id}/read", tags=["System"], summary="Mark notification read")
def read_notification(notif_id: int, session: Session = Depends(get_session)):
    """Mark a specific notification as read."""
    n = session.get(Notification, notif_id)
    if n:
        n.is_read = True
        session.add(n)
        session.commit()
    return {"message": "Marked read"}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

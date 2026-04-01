from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

#---------------uvicorn main:app --reload --host 0.0.0.0 --port 8000

app = FastAPI()

#-----------------------------------------------------
# data models

class ChoreCreate(BaseModel):
    name: str
    description: str
    points: int
    assigned_to: int | None = None

#-------------------------------------------------------------------
# mock data
chores = []
users = [
    {
        "id": 1,
        "name": "Parent User",
        "role": "parent",
        "points": 0
    },
    {
        "id": 2,
        "name": "Child User",
        "role": "child",
        "points": 20
    }
]

#--------------------------------------------------
# root

@app.get("/")
def read_root():
    return {"message": "API is running"}

#---------------------------------------------------------------------------------------------------------------------
# chore routes

@app.get("/chores")
def get_chores():
    return chores

@app.get("/chores/{chore_id}")
def get_chore(chore_id: int):
    for chore in chores:
        if chore["id"] == chore_id:
            return chore
    raise HTTPException(status_code=404, detail= "Chore not found")
    

@app.post("/chores")
def create_chore(chore: ChoreCreate):
    new_chore = {
        "id": len(chores) + 1,
        "name": chore.name,
        "description": chore.description,
        "points": chore.points,
        "assigned_to": chore.assigned_to,
        "completed": False,
        "approved": False
    }
    chores.append(new_chore)
    return {"message": "Chore created", "chore": new_chore}




@app.put("/chores/{chore_id}/complete")
def complete_chore(chore_id: int):
    for chore in chores:
        if chore["id"] == chore_id:
            chore["completed"] = True
            return {"message": f"Chore {chore_id} marked complete", "chore": chore}
    raise HTTPException(status_code=404, detail="Chore not found")



@app.put("/chores/{chore_id}/approve")
def approve_chore(chore_id: int):
    for chore in chores:
        if chore["id"] == chore_id:
            chore["approved"] = True
            return {"message": f"Chore {chore_id} approved", "chore": chore}
    raise HTTPException(status_code=404, detail="Chore not found")



@app.delete("/chores/{chore_id}")
def delete_chore(chore_id: int):
    for chore in chores:
        if chore["id"] == chore_id:
            chores.remove(chore)
            return {"message": f"Chore {chore_id} deleted", "chore": chore}
    raise HTTPException(status_code=404, detail="Chore not found")

#-------------------------------------------------------------------------------------------

# user routes

@app.get("/users")
def get_users():
    return users

@app.get("/users/{user_id}")
def get_user(user_id: int):
    for user in users:
        if user["id"] == user_id:
            return user
    return {"error": "User not found"}


@app.post("/users")
def create_user(user: dict):
    users.append(user)
    return {"message": "User created", "user": user}

#---------------------------------------------------------------------------------

# AUTH ROUTES

@app.post ("/signup")
def signup(user: dict):
    users.append(user)
    return {"message": "Signup successful", "user": user}

@app.post("/login")
def login(credentials: dict):
    return {"message": "Login route created", "credentials": credentials}

#--------------------------------------------------------------------
#Assignment routes

@app.put("/chores/{chore_id}/assign/{user_id}")
def assign_chore(chore_id: int, user_id: int):
    # check user exists
    user_exists = any(user["id"] == user_id for user in users)
    if not user_exists:
        raise HTTPException(status_code=404, detail="User not found")
    
    
    for chore in chores:
        if chore["id"] == chore_id:
            chore["assigned_to"] = user_id  # Assign user to the chore
            return {
                "message": f"Chore {chore_id} assigned to user {user_id}",
                "chore": chore
            }

    raise HTTPException(status_code=404, detail="Chore not found")
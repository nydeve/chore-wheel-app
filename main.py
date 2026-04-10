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
rewards = [
    {
        "id": 1,
        "name": "Ice Cream",
        "cost": 10
    },
    {
        "id": 2,
        "name": "Movie Night",
        "cost": 25
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
            if not chore["completed"]:
                raise HTTPException(status_code=400, detail="Chore must be completed before approval")

            if chore["approved"]:
                raise HTTPException(status_code=400, detail="Chore already approved")

            chore["approved"] = True

            # award points to assigned user
            assigned_user = next((user for user in users if user["id"] == chore["assigned_to"]), None)
            if assigned_user:
                assigned_user["points"] += chore["points"]

            return {
                "message": f"Chore {chore_id} approved and points awarded",
                "chore": chore,
                "user": assigned_user
            }

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

@app.get("/rewards")
def get_rewards():
    return rewards


@app.get("/rewards/{reward_id}")
def get_reward(reward_id: int):
    for reward in rewards:
        if reward["id"] == reward_id:
            return reward
    raise HTTPException(status_code=404, detail="Reward not found")


@app.put("/users/{user_id}/redeem/{reward_id}")
def redeem_reward(user_id: int, reward_id: int):
    user = next((user for user in users if user["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    reward = next((reward for reward in rewards if reward["id"] == reward_id), None)
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")

    if user["points"] < reward["cost"]:
        raise HTTPException(status_code=400, detail="Not enough points to redeem this reward")

    user["points"] -= reward["cost"]

    return {
        "message": f"Reward '{reward['name']}' redeemed successfully",
        "user": user,
        "reward": reward
    }

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
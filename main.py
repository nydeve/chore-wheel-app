from fastapi import FastAPI

#---------------uvicorn main:app --reload --host 0.0.0.0 --port 8000

app = FastAPI()

# mock data
chores = [
    {
        "id": 1,
        "name": "Take out the trash",
        "points": 10,
        "completed": False,
        "approved": False
    }
]
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

@app.get("/")
def read_root():
    return {"message": "API is running"}

#---------------------------------------------------------------------------------------------------------------------
# chore routes

@app.get("/chores")
def get_chores():
    return chores

@app.post("/chores")
def create_chore(chore: dict):
    chores.append(chore)
    return {"message": "Chore created", "chore": chore}

@app.put("/chores/{chore_id}/complete")
def complete_chore(chore_id: int):
    for chore in chores:
        if chore["id"] == chore_id:
            chore["completed"] = True
            return {"message": f"Chore {chore_id} marked complete", "chore": chore}
    return {"error": "Chore not found"}

@app.put("/chores/{chore_id}/approve")
def approve_chore(chore_id: int):
    for chore in chores:
        if chore["id"] == chore_id:
            chore["approved"] = True
            return {"message": f"Chore {chore_id} approved", "chore": chore}
    return {"error": "Chore not found"}

@app.delete("/chores/{chore_id}")
def delete_chore(chore_id: int):
    for chore in chores:
        if chore["id"] == chore_id:
            chores.remove(chore)
            return {"message": f"Chore {chore_id} deleted", "chore": chore}
    return {"error": "Chore not found"}

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
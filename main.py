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


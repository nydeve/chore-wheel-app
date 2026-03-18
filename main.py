from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "API is running"}


@app.get("/chores")
def get_chores():
    return [
        {"id": 1, "title": "Clean room", "status": "assigned"}
    ]
#no longer needed
'''
from pydantic import BaseModel

class ChoreCreate(BaseModel):
    title: str

class ChoreResponse(BaseModel):
    id: int
    title: str
    status: str

    class Config:
        orm_mode = True


class RewardResponse(BaseModel):
    id: int
    name: str
    points_required: int

    class Config:
        orm_mode = True
'''

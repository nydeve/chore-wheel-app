# bridge between database and auth

from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    PARENT = "parent"
    CHILD = "child"

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    display_name: str
    role: UserRole = UserRole.PARENT
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    parent_id: Optional[int] = Field(default=None, foreign_key="user.id")

    total_points: int = Field(default=0) 
    chores: List["Chore"] = Relationship(back_populates="assigned_user")

class Chore(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
    points_worth: int = Field(default=10)
    status: str = Field(default="assigned") 
    
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    assigned_user: Optional[User] = Relationship(back_populates="chores")

class Reward(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    points_required: int
